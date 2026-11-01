// Step 1 of create: the framework's official scaffolder writes the base project (always its latest release), then
// a few precise edits make it ready for the kit's files.
import { existsSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { parseDocument } from "yaml";
import { kitRoot, manifest, type ProjectKitConfig } from "../kit-config";
import { dlxArgs } from "../package-manager";
import { run, runStreaming } from "../run";

const issues: string =
	JSON.parse(readFileSync(join(kitRoot, "package.json"), "utf8")).bugs?.url ?? "the create-agent-ready-app repository";

// The scaffold command comes from the manifest; {deployment} is the framework's own name for the deploy target
// (TanStack calls the Node server "nitro").
export async function scaffoldBase(root: string, config: ProjectKitConfig, onLine: (line: string) => void) {
	const framework = manifest.frameworks[config.framework];
	if (!framework) throw new Error(`Unknown framework ${config.framework}`);
	const values: Record<string, string> = {
		name: config.name,
		dir: basename(root),
		pm: config.pm,
		deployment: framework.deployments?.[config.deploy] ?? config.deploy,
	};
	const [pkg = "", ...args] = framework.scaffold.map((part) => part.replace(/\{(\w+)\}/g, (_match, key: string) => values[key] ?? ""));
	const [command = "npx", ...rest] = dlxArgs(config.pm, pkg, args);
	const result = await runStreaming(command, rest, dirname(root), onLine);
	if (result.code !== 0) throw new Error(`${framework.label}'s scaffolder failed:\n${result.out.split("\n").slice(-15).join("\n")}`);
	const missing = framework.expectFiles.filter((file) => !existsSync(join(root, file)));
	if (missing.length) {
		throw new Error(`${framework.label}'s scaffolder no longer creates ${missing.join(", ")}. Please report it: ${issues}`);
	}
}

// tsconfig: one import alias (#/, from package.json "imports") and the types for `.svg?react` imports.
export function patchTsconfig(root: string) {
	const path = join(root, "tsconfig.json");
	let text = readFileSync(path, "utf8");
	text = text.replace(/,?\s*"@\/\*"\s*:\s*\[[^\]]*\]/, "");
	if (!text.includes("vite-plugin-svgr/client")) text = text.replace(/"types"\s*:\s*\[/, '"types": ["vite-plugin-svgr/client", ');
	writeFileSync(path, text);
}

const stripJsonComments = (text: string) => text.replace(/^\s*\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");

// wrangler.jsonc: the project's name, today's compatibility date, logs on, and the bindings and secrets the add-ons
// read. Placeholder ids are replaced once the resources exist (docs/DEPLOYMENT.md).
export function patchWrangler(root: string, config: ProjectKitConfig) {
	const path = join(root, "wrangler.jsonc");
	if (!existsSync(path)) return;
	const wrangler = JSON.parse(stripJsonComments(readFileSync(path, "utf8")));
	wrangler.name = config.name;
	wrangler.compatibility_date = new Date().toISOString().slice(0, 10);
	wrangler.observability = { enabled: true };
	if (config.addOns.includes("db") && config.db === "postgres") {
		// localConnectionString: the Docker database from docker-compose.yaml, so `dev` works without a .env.
		wrangler.hyperdrive = [
			{ binding: "HYPERDRIVE", id: "00000000000000000000000000000000", localConnectionString: "postgres://app:app@localhost:5432/app" },
		];
	}
	if (config.addOns.includes("db") && config.db === "d1") {
		wrangler.d1_databases = [
			{
				binding: "DB",
				database_name: config.name,
				database_id: "00000000-0000-0000-0000-000000000000",
				migrations_dir: "src/server/db/drizzle/migrations",
			},
		];
	}
	const secrets = requiredSecrets(config);
	if (secrets.length) wrangler.secrets = { required: secrets };
	writeFileSync(path, `${JSON.stringify(wrangler, null, 2)}\n`);
}

// After install: the newest compatibility date the installed Workers runtime supports (its version is 1.YYYYMMDD.x),
// so `vite dev` and prerendering never ask for a date the local runtime doesn't know yet.
export function pinCompatibilityDate(root: string) {
	const path = join(root, "wrangler.jsonc");
	const wrangler = findPackageDir(root, "wrangler");
	const miniflare = wrangler && findPackageDir(wrangler, "miniflare");
	const workerd = miniflare && findPackageDir(miniflare, "workerd");
	if (!existsSync(path) || !workerd) return;
	const version: string = JSON.parse(readFileSync(join(workerd, "package.json"), "utf8")).version;
	const match = version.match(/^\d+\.(\d{4})(\d{2})(\d{2})/);
	if (!match) return;
	const supported = `${match[1]}-${match[2]}-${match[3]}`;
	const config = JSON.parse(stripJsonComments(readFileSync(path, "utf8")));
	if (config.compatibility_date <= supported) return;
	config.compatibility_date = supported;
	writeFileSync(path, `${JSON.stringify(config, null, 2)}\n`);
}

// Where Node would find `name` when `from` imports it: <ancestor>/node_modules/<name>, nearest first. Works for
// hoisted (npm, bun), nested and pnpm layouts.
function findPackageDir(from: string, name: string): string | undefined {
	for (let dir = realpathSync(from); ; dir = dirname(dir)) {
		const candidate = basename(dir) === "node_modules" ? join(dir, name) : join(dir, "node_modules", name);
		if (existsSync(join(candidate, "package.json"))) return candidate;
		if (dirname(dir) === dir) return undefined;
	}
}

function requiredSecrets(config: ProjectKitConfig): string[] {
	const secrets: string[] = [];
	if (config.addOns.includes("auth")) secrets.push("BETTER_AUTH_SECRET", "BETTER_AUTH_URL");
	if (config.addOns.includes("email")) {
		secrets.push("EMAIL_FROM", "EMAIL_FROM_NAME", config.email === "zeptomail" ? "ZEPTOMAIL_TOKEN" : "RESEND_API_KEY");
	}
	return secrets;
}

// Node projects run the agent scripts as .ts files, which needs Node 22.18 or newer.
export function patchPackageJson(root: string, config: ProjectKitConfig) {
	const path = join(root, "package.json");
	const pkg = JSON.parse(readFileSync(path, "utf8"));
	pkg.name = config.name;
	if (config.runtime === "node") pkg.engines = { ...pkg.engines, node: ">=22.18" };
	// pnpm/action-setup in CI needs a pnpm version, and pnpm itself switches to this one, so CI and every machine
	// write the same lockfile.
	const pnpmVersion = config.pm === "pnpm" ? run("pnpm", ["--version"], root).out.match(/^\d+\.\d+\.\d+\S*/)?.[0] : undefined;
	if (pnpmVersion) pkg.packageManager = `pnpm@${pnpmVersion}`;
	// TanStack Intent only runs unattended once package.json says which packages' skills agents may load.
	if (config.framework === "tanstack-start") pkg.intent = { skills: ["@tanstack/*"], ...pkg.intent };
	writeFileSync(path, `${JSON.stringify(pkg, null, 2)}\n`);
}

// pnpm fails an install whose dependencies have build scripts nobody reviewed (strictDepBuilds), and leaves a
// "set this to true or false" placeholder in pnpm-workspace.yaml. The kit's stack needs these builds (esbuild for
// drizzle-kit and Vite); everything the scaffolder already decided stays as it was.
export function allowPnpmBuilds(root: string, config: ProjectKitConfig) {
	if (config.pm !== "pnpm" || !manifest.pnpmAllowBuilds?.length) return;
	const path = join(root, "pnpm-workspace.yaml");
	const doc = parseDocument(existsSync(path) ? readFileSync(path, "utf8") : "");
	for (const name of manifest.pnpmAllowBuilds) doc.setIn(["allowBuilds", name], true);
	writeFileSync(path, doc.toString());
}
