// Facts the agent scripts need: the project's kit settings, the git user, which agent is running, changed files.
// Runs on Node (22.18+, which runs .ts directly) and on Bun, so it uses only node: modules.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export type KitConfig = {
	name: string;
	framework: string;
	runtime: "bun" | "node";
	pm: "bun" | "pnpm" | "npm";
	deploy: string;
	addOns: string[];
	db?: "postgres" | "d1";
};

export function readKitConfig(root: string): KitConfig {
	const path = join(root, ".agents/kit.json");
	return existsSync(path)
		? JSON.parse(readFileSync(path, "utf8"))
		: { name: "project", framework: "tanstack-start", runtime: "node", pm: "npm", deploy: "nitro", addOns: [] };
}

// The same flags the kit renders templates with, e.g. "runtime-bun", "cloudflare", "db", "postgres".
export function flagsOf(kit: KitConfig): Set<string> {
	return new Set([kit.framework, `runtime-${kit.runtime}`, `pm-${kit.pm}`, kit.deploy, ...kit.addOns, ...(kit.db ? [kit.db] : [])]);
}

// True when this file was run directly (`node scripts/agent/x.ts`), false when another script imports it.
export function isMain(moduleUrl: string): boolean {
	const entry = process.argv[1];
	return entry !== undefined && realpathSync(entry) === realpathSync(fileURLToPath(moduleUrl));
}

export function run(command: string, args: string[], cwd: string, inherit = false): { code: number; out: string } {
	const result = spawnSync(command, args, { cwd, encoding: "utf8", stdio: inherit ? "inherit" : "pipe", shell: process.platform === "win32" });
	return { code: result.status ?? 1, out: `${result.stdout ?? ""}${result.stderr ?? ""}`.trim() };
}

export function git(root: string, args: string[]): string | undefined {
	const result = run("git", args, root);
	return result.code === 0 ? result.out : undefined;
}

export const gitUser = (root: string) => git(root, ["config", "user.name"]) || process.env.USER || "unknown";

// --by wins; otherwise a known agent's environment variable; otherwise a human ran the script.
const agentMarkers: [string, string][] = [
	["CLAUDECODE", "claude"],
	["CODEX_SANDBOX", "codex"],
	["CURSOR_AGENT", "cursor"],
	["GEMINI_CLI", "gemini"],
];

export function agentName(by?: string): string {
	return by ?? agentMarkers.find(([variable]) => process.env[variable])?.[1] ?? "human";
}

const pad = (value: number) => String(value).padStart(2, "0");

export function today(date = new Date()): string {
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function nowStamp(date = new Date()): string {
	return `${today(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// Files changed since `base` (if given), plus unstaged, staged and untracked files. Empty outside a git repo.
export function changedFiles(root: string, base?: string): string[] {
	const lists = [
		base ? git(root, ["diff", "--name-only", `${base}...HEAD`]) : undefined,
		git(root, ["diff", "--name-only"]),
		git(root, ["diff", "--name-only", "--cached"]),
		git(root, ["ls-files", "--others", "--exclude-standard"]),
	];
	return [...new Set(lists.flatMap((list) => list?.split("\n").filter(Boolean) ?? []))].sort();
}

// "src/features/billing/…" → "billing", "src/server/db/…" → "server", other files → their top folder or name.
export function areaOf(path: string): string {
	const parts = path.split("/");
	if (parts[0] === "src" && parts[1] === "features" && parts[2]) return parts[2];
	if (parts[0] === "src" && parts.length > 2 && parts[1]) return parts[1];
	return parts.length > 1 && parts[0] ? parts[0] : path;
}
