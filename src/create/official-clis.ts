// The official tools that write their own files: shadcn (components and theme), Wrangler (Worker types), Better Auth
// (auth tables), drizzle-kit (the first migration), TanStack Intent (the skill block in AGENTS.md). Each runs only when
// its add-on or framework was chosen, and streams its output to the step's log.
import { existsSync, readdirSync, readFileSync, rmdirSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { activeKeys, manifest, type ProjectKitConfig } from "../kit-config";
import { dlxArgs, execArgs, packageManagers } from "../package-manager";
import { lastLine, runStreaming } from "../run";

export type ToolStep = { label: string; ok: boolean; detail?: string };

export async function runOfficialClis(
	root: string,
	config: ProjectKitConfig,
	flags: Set<string>,
	onLine: (line: string) => void,
): Promise<ToolStep[]> {
	const steps: ToolStep[] = [];
	const exec = async (label: string, [command = "npx", ...args]: string[]) => {
		onLine(`▸ ${label}`);
		const result = await runStreaming(command, args, root, onLine);
		steps.push({ label, ok: result.code === 0, detail: result.code === 0 ? undefined : lastLine(result.out) });
		return result.code === 0;
	};
	const script = (label: string, name: string) => exec(label, [...packageManagers[config.pm].run.split(" "), name]);

	if (flags.has("shadcn")) {
		const components = [...new Set(activeKeys(manifest.shadcn.components, flags).flat())];
		if (await exec("shadcn theme", dlxArgs(config.pm, "shadcn@latest", ["apply", "--preset", manifest.shadcn.preset, "-y"]))) {
			await exec(`shadcn components (${components.join(", ")})`, dlxArgs(config.pm, "shadcn@latest", ["add", ...components, "-y"]));
		}
		removeUtilsReexport(root);
	}
	if (flags.has("cloudflare")) await script("Worker types (wrangler types)", "cf-typegen");
	if (flags.has("auth")) await script("Better Auth tables", "auth:generate");
	if (flags.has("db") && existsSync(join(root, "src/server/auth/better-auth/tables.ts"))) {
		await script("first migration (drizzle-kit generate)", "db:generate");
	}
	// TanStack ships version-matched skills inside its packages; Intent points agents at them from AGENTS.md.
	if (flags.has("tanstack-start")) await exec("TanStack Intent skill block", execArgs(config.pm, "intent", ["install"]));
	await script("format (biome check --write)", "fix");
	return steps;
}

// shadcn imports cn from its `cn` package; the src/shared/lib/utils.ts it writes only re-exports it, so it goes, and
// the files shadcn pointed at it (Next.js's layout, for its font) import the package instead.
function removeUtilsReexport(root: string) {
	const path = join(root, "src/shared/lib/utils.ts");
	if (!existsSync(path) || !/^export \{ cn \} from ["']cn["'];?\s*$/.test(readFileSync(path, "utf8"))) return;
	for (const file of sourceFiles(join(root, "src"))) {
		const text = readFileSync(file, "utf8");
		const fixed = text.replace(/from (["'])#\/shared\/lib\/utils\1/g, "from $1cn$1");
		if (fixed !== text) writeFileSync(file, fixed);
	}
	unlinkSync(path);
	const dir = join(root, "src/shared/lib");
	if (!readdirSync(dir).length) rmdirSync(dir);
}

const sourceFiles = (dir: string): string[] =>
	readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) return sourceFiles(full);
		return /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
	});
