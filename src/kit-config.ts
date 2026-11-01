// Reads the kit manifest and a project's kit settings, and works out which template flags and variables apply.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { type PackageManager, packageManagers } from "./package-manager";

// src/kit-config.ts and the built dist/cli.js both sit one folder below the package root.
export const kitRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const templateRoot = join(kitRoot, "template");

export type Runtime = "bun" | "node";
export type Deploy = "node" | "vercel" | "cloudflare";
export type Database = "postgres" | "d1";
export type EmailProvider = "resend" | "zeptomail";

// What a project is made of: chosen at create time, saved as .agents/kit.json, read by update, add, remove and doctor.
export type Choices = {
	framework: string;
	runtime: Runtime;
	pm: PackageManager;
	deploy: Deploy;
	addOns: string[];
	db?: Database;
	email?: EmailProvider;
	// Optional skill packs the user checked (the always-on and add-on packs follow from the other choices).
	skills: string[];
	// The awesome-design-md entry copied into design/DESIGN.md, if one was picked.
	design?: string;
};

export type ProjectKitConfig = Choices & { kitVersion: string; name: string; createdOn: string };

// `when` lists flags that must all be on ("!flag": must be off). Paths ending in / cover everything below them.
// block: the kit owns only the text between its markers in that file (AGENTS.md, CLAUDE.md).
export type FileRule = { path: string; owner: "kit" | "project" | "merge" | "block"; when?: string[]; replace?: boolean };
export type PermissionLists = { allow: string[]; ask: string[]; deny: string[] };
export type SkillSource = { repo: string; skills: string[] };
export type SkillPack = {
	label: string;
	hint?: string;
	when?: string[];
	optional?: boolean;
	frameworks?: string[];
	sources: SkillSource[];
};
export type AddOnGroup = { label: string; pickOne?: boolean; items: string[] };
type Option = { label: string; hint?: string; requires?: string[]; default?: boolean };

export type Manifest = {
	verifiedOn: string;
	frameworks: Record<
		string,
		{ label: string; hint: string; scaffold: string[]; expectFiles: string[]; deployments?: Partial<Record<Deploy, string>> }
	>;
	runtimes: Record<Runtime, Option & { pms: PackageManager[] }>;
	deploys: Record<Deploy, Option>;
	addOns: Record<string, Option>;
	databases: Record<Database, Option & { deploys?: Deploy[] }>;
	emailProviders: Record<EmailProvider, Option>;
	addOnGroups: AddOnGroup[];
	presets: Record<string, string[]>;
	packages: Record<string, { deps?: string[]; dev?: string[] }>;
	verified: Record<string, string>;
	holdBack: Record<string, { major: string; reason: string }>;
	scaffoldLines?: Record<string, string>;
	pnpmAllowBuilds?: string[];
	shadcn: { preset: string; components: Record<string, string[]> };
	skillPacks: Record<string, SkillPack>;
	files: FileRule[];
	scripts: Record<string, Record<string, string>>;
	removeScripts: string[];
	scriptsAddOnly: string[];
	claudeSettings: Record<string, Partial<PermissionLists>>;
	gitignore: string[];
	gitattributes: string[];
	routeTreeFileFooter: string;
	tsconfigFlags: string[];
	legacyAgentFiles: string[];
	budgets: Record<string, number>;
};

export const manifest: Manifest = JSON.parse(readFileSync(join(kitRoot, "manifest.json"), "utf8"));

// package.json is the only place the version lives (npm always ships it), so `npm version` is the whole bump.
export const kitVersion: string = JSON.parse(readFileSync(join(kitRoot, "package.json"), "utf8")).version;

// Agent files, then the app code both frameworks share (server/, shared/, the auth forms…), then the framework's own
// files: a later root's file with the same path wins.
export const templateRoots = (framework: string) => [
	join(templateRoot, "agent"),
	join(templateRoot, "app"),
	join(templateRoot, "frameworks", framework),
];

// Saved as .agents/kit.lock.json: what the kit wrote last time, so updates never overwrite the project's own edits.
// skills: community skill name → its source repo.
export type KitLock = {
	files: Record<string, string>;
	scripts: Record<string, string>;
	settings: PermissionLists;
	skills: Record<string, string>;
};

export const configPath = (root: string) => join(root, ".agents/kit.json");
export const lockPath = (root: string) => join(root, ".agents/kit.lock.json");

export function readProjectConfig(root: string): ProjectKitConfig | undefined {
	if (!existsSync(configPath(root))) return undefined;
	const config = JSON.parse(readFileSync(configPath(root), "utf8"));
	return { skills: [], ...config };
}

export function readLock(root: string): KitLock {
	const empty: KitLock = { files: {}, scripts: {}, settings: { allow: [], ask: [], deny: [] }, skills: {} };
	return existsSync(lockPath(root)) ? { ...empty, ...JSON.parse(readFileSync(lockPath(root), "utf8")) } : empty;
}

export function writeProjectState(root: string, config: ProjectKitConfig, lock: KitLock) {
	writeJson(configPath(root), config);
	writeJson(lockPath(root), lock);
}

export function writeJson(path: string, value: unknown) {
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, `${JSON.stringify(value, null, "\t")}\n`);
}

export const sha256 = (text: string) => createHash("sha256").update(text).digest("hex");

// Flags for {{#flag}} blocks, file rules, scripts, packages, permissions and skill packs. Besides the choices
// themselves: server (any server add-on) or static, nitro (TanStack Start's server everywhere but Workers),
// skills-<pack> for each optional skill pack, and helpers that keep the templates readable.
export function renderFlags(config: Choices): Set<string> {
	const flags = new Set<string>([config.framework, `runtime-${config.runtime}`, `pm-${config.pm}`, config.deploy, ...config.addOns]);
	const has = (flag: string) => flags.has(flag);
	if (has("db") && config.db) flags.add(config.db);
	if (has("email") && config.email) flags.add(config.email);
	for (const pack of config.skills ?? []) flags.add(`skills-${pack}`);
	if (config.framework === "tanstack-start" && config.deploy !== "cloudflare") flags.add("nitro");
	if (has("auth") && has("form") && has("shadcn") && has("query")) flags.add("auth-pages");
	flags.add(["hono", "db", "auth"].some(has) ? "server" : "static");
	if (has("hono") || has("auth")) flags.add("error-model");
	if (has("hono") && (has("db") || has("auth"))) flags.add("hono-context");
	if ((has("postgres") && !has("cloudflare")) || has("auth") || has("email")) flags.add("server-env");
	if (has("postgres") || has("auth") || has("email")) flags.add("dotenv");
	return flags;
}

// The skill packs a project gets: every always-on pack, the packs of its add-ons, and the optional packs it chose.
export function activeSkillPacks(config: Choices, flags = renderFlags(config)): [string, SkillPack][] {
	return Object.entries(manifest.skillPacks).filter(([id, pack]) => {
		if (pack.frameworks && !pack.frameworks.includes(config.framework)) return false;
		return pack.optional ? (config.skills ?? []).includes(id) : appliesTo(pack.when, flags);
	});
}

// One line per active pack for AGENTS.md: "- React: vercel-react-best-practices · …".
export function communitySkillsList(config: Choices, flags = renderFlags(config)): string {
	return activeSkillPacks(config, flags)
		.map(([, pack]) => `- ${pack.label}: ${pack.sources.flatMap((source) => source.skills).join(" · ")}`)
		.join("\n");
}

export function renderVars(config: ProjectKitConfig): Record<string, string> {
	const pm = packageManagers[config.pm];
	return {
		name: config.name,
		date: config.createdOn,
		kitVersion: config.kitVersion,
		framework: manifest.frameworks[config.framework]?.label ?? config.framework,
		runtime: manifest.runtimes[config.runtime]?.label ?? config.runtime,
		deploy: manifest.deploys[config.deploy]?.label ?? config.deploy,
		db: config.db ? (manifest.databases[config.db]?.label ?? config.db) : "none",
		emailService: config.email ? (manifest.emailProviders[config.email]?.label ?? config.email) : "none",
		addOns: config.addOns.map((name) => manifest.addOns[name]?.label ?? name).join(", ") || "none",
		communitySkills: communitySkillsList(config),
		pm: config.pm,
		run: pm.run,
		exec: pm.exec,
		dlx: pm.dlx,
		install: pm.install,
		installFrozen: pm.installFrozen,
		add: pm.add,
		addDev: pm.addDev,
		audit: pm.audit,
		outdated: pm.outdated,
		lockfile: pm.lockfile,
		script: config.runtime === "bun" ? "bun" : "node",
		emailProvider: config.email ?? "",
		authProvider: config.db === "d1" ? "sqlite" : "pg",
		authDialect: config.db === "d1" ? "sqlite" : "postgresql",
	};
}

// A rule, script group or skill pack applies when every flag it names is on ("!flag": off).
export const appliesTo = (when: string[] | undefined, flags: Set<string>) =>
	!when || when.every((flag) => (flag.startsWith("!") ? !flags.has(flag.slice(1)) : flags.has(flag)));

export function ruleFor(path: string): FileRule {
	return (
		manifest.files.find((rule) => (rule.path.endsWith("/") ? path.startsWith(rule.path) : path === rule.path)) ?? {
			path,
			owner: "project",
		}
	);
}

// Manifest maps (scripts, packages, permissions) are keyed by "core", a flag, or flags joined with "+".
export function activeKeys<T>(map: Record<string, T>, flags: Set<string>): T[] {
	return Object.entries(map)
		.filter(([key]) => key === "core" || appliesTo(key.split("+"), flags))
		.map(([, value]) => value);
}
