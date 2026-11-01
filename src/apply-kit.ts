// Puts the kit into a project (create, install, update, add or remove an add-on) without overwriting the project's own
// work: kit-owned files are replaced only while untouched, project-owned files are created once, the rest is merged.
import {
	appendFileSync,
	chmodSync,
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	rmdirSync,
	statSync,
	unlinkSync,
	writeFileSync,
} from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import {
	activeKeys,
	appliesTo,
	type KitLock,
	manifest,
	type PermissionLists,
	type ProjectKitConfig,
	readLock,
	renderFlags,
	renderVars,
	ruleFor,
	sha256,
	templateRoots,
	writeProjectState,
} from "./kit-config";
import {
	addTsconfigFlags,
	appendMissingLines,
	excludeFromTsconfig,
	ensureBiomeExtends,
	ensureRouteTreeFooter,
	mergeClaudeSettings,
	mergePackageScripts,
	mergeSourcesJson,
} from "./merge-project-files";
import { packageManagers } from "./package-manager";
import { renderTemplate } from "./render-template";
import type { Report } from "./report";
import { run } from "./run";
import { syncSkills } from "./skills";

// create: replace the scaffold's own copies of files marked "replace" (router.tsx, vite.config.ts…); community skills
// are installed later by create's own step. appFiles: false (install, update) never adds the framework's app files
// (src/…, app config). skills: install missing community skills now (install, update, add, remove).
export type ApplyOptions = { dryRun: boolean; force: boolean; skills: boolean; create?: boolean; appFiles?: boolean };

// The kit's part of AGENTS.md and CLAUDE.md. Next.js (nextjs-agent-rules), TanStack Intent (intent-skills) and the
// project's own text live outside it and are never touched.
export const blockStart = "<!-- BEGIN:agent-ready -->";
export const blockEnd = "<!-- END:agent-ready -->";
const otherBlockEnds = ["<!-- intent-skills:end -->", "<!-- END:nextjs-agent-rules -->", "<!-- END:nextjs-agent-feedback -->"];

type TemplateFile = { path: string; source: string; fromFramework: boolean };

export function applyKit(root: string, config: ProjectKitConfig, options: ApplyOptions, report: Report) {
	const lock = readLock(root);
	const flags = renderFlags(config);
	const vars = renderVars(config);
	const render = (text: string) => renderTemplate(text, flags, vars);
	if (!options.create) moveLegacyAgentFiles(root, report, options.dryRun);

	const kitFiles: Record<string, string> = {};
	for (const file of listTemplateFiles(config.framework)) {
		const rule = ruleFor(file.path);
		if (!appliesTo(rule.when, flags)) continue;
		if (rule.owner === "project" && file.fromFramework && options.appFiles === false) continue;
		const content = render(readFileSync(file.source, "utf8"));
		if (rule.owner === "merge") mergeSourcesJson(root, file.path, content, report, options.dryRun);
		else if (rule.owner === "project") {
			writeProjectFile(root, file, content, Boolean(options.create && rule.replace), report, options.dryRun);
		} else {
			const write = rule.owner === "block" ? writeKitBlock : writeKitFile;
			const hash = write(root, file, content, lock.files[file.path], options, report);
			if (hash) kitFiles[file.path] = hash;
		}
	}
	removeStaleKitFiles(root, lock.files, kitFiles, options, report);

	const desiredScripts: Record<string, string> = {};
	for (const group of activeKeys(manifest.scripts, flags)) {
		for (const [name, command] of Object.entries(group)) desiredScripts[name] = render(command);
	}
	const scripts = mergePackageScripts(
		root,
		desiredScripts,
		options.create ? manifest.removeScripts : [],
		manifest.scriptsAddOnly,
		lock.scripts,
		report,
		options.dryRun,
		options.create,
	);
	appendMissingLines(join(root, ".gitignore"), manifest.gitignore, ".gitignore", report, options.dryRun);
	appendMissingLines(join(root, ".gitattributes"), manifest.gitattributes.map(render), ".gitattributes", report, options.dryRun);
	addTsconfigFlags(join(root, "tsconfig.json"), manifest.tsconfigFlags, report, options.dryRun);
	excludeFromTsconfig(join(root, "tsconfig.json"), [".agents", ".claude"], report, options.dryRun);
	if (!options.create) ensureBiomeExtends(join(root, "biome.json"), report, options.dryRun);
	ensureRouteTreeFooter(root, manifest.routeTreeFileFooter, report, options.dryRun);
	const settings = mergeClaudeSettings(root, permissionsFor(flags, render), lock.settings, report, options.dryRun);
	const skills = options.dryRun || options.create ? lock.skills : syncSkills(root, config, lock.skills, report, options.skills);

	if (!options.dryRun) {
		const newLock: KitLock = { files: kitFiles, scripts, settings, skills };
		writeProjectState(root, config, newLock);
		linkSkillsAndHooks(root, config, report);
	}
	if (!options.create) noteMissingPackages(root, config, flags, report);
}

// Every template file for the framework, as project-relative paths. A later root overrides an earlier one; files
// outside the agent root are app code (fromFramework), which install and update never add.
export function listTemplateFiles(framework: string): TemplateFile[] {
	const files = new Map<string, TemplateFile>();
	const [agentRoot, ...appRoots] = templateRoots(framework);
	for (const dir of [agentRoot, ...appRoots]) {
		if (!dir) continue;
		for (const source of walk(dir)) {
			const path = relative(dir, source).split(sep).join("/");
			files.set(path, { path, source, fromFramework: dir !== agentRoot });
		}
	}
	return [...files.values()].sort((a, b) => a.path.localeCompare(b.path));
}

function walk(dir: string): string[] {
	if (!existsSync(dir)) return [];
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		if (entry.name === ".DS_Store") return [];
		const full = join(dir, entry.name);
		return entry.isDirectory() ? walk(full) : [full];
	});
}

function writeFile(root: string, file: TemplateFile, content: string) {
	const dest = join(root, file.path);
	mkdirSync(dirname(dest), { recursive: true });
	writeFileSync(dest, content);
	chmodSync(dest, statSync(file.source).mode);
}

function writeProjectFile(root: string, file: TemplateFile, content: string, replace: boolean, report: Report, dryRun: boolean) {
	const exists = existsSync(join(root, file.path));
	if (exists && !replace) return;
	if (!dryRun) writeFile(root, file, content);
	(exists ? report.updated : report.created).push(file.path);
}

// Returns the hash to remember for this kit file, or undefined when the project owns a file with that name.
function writeKitFile(
	root: string,
	file: TemplateFile,
	content: string,
	lockedHash: string | undefined,
	options: ApplyOptions,
	report: Report,
): string | undefined {
	const dest = join(root, file.path);
	const hash = sha256(content);
	if (!existsSync(dest)) {
		if (!options.dryRun) writeFile(root, file, content);
		report.created.push(file.path);
		return hash;
	}
	const current = readFileSync(dest, "utf8");
	if (current === content) return hash;
	if (options.force || (lockedHash !== undefined && sha256(current) === lockedHash)) {
		if (!options.dryRun) writeFile(root, file, content);
		report.updated.push(file.path);
		return hash;
	}
	report.skipped.push(`${file.path} (changed in this project; --force replaces it)`);
	return lockedHash;
}

// Like writeKitFile, for the kit's block inside a shared file: only the text between the markers is the kit's (and
// hashed). A file without the block gets it after the frameworks' own blocks, or at the top.
function writeKitBlock(
	root: string,
	file: TemplateFile,
	content: string,
	lockedHash: string | undefined,
	options: ApplyOptions,
	report: Report,
): string | undefined {
	const dest = join(root, file.path);
	const body = content.trim();
	const hash = sha256(body);
	const block = `${blockStart}\n${body}\n${blockEnd}`;
	const save = (text: string) => {
		if (options.dryRun) return;
		mkdirSync(dirname(dest), { recursive: true });
		writeFileSync(dest, text);
	};
	if (!existsSync(dest)) {
		save(`${block}\n`);
		report.created.push(file.path);
		return hash;
	}
	const current = readFileSync(dest, "utf8");
	const start = current.indexOf(blockStart);
	const end = current.indexOf(blockEnd, start);
	if (start === -1 || end === -1) {
		const after = Math.max(...otherBlockEnds.map((marker) => (current.includes(marker) ? current.indexOf(marker) + marker.length : 0)));
		const before = current.slice(0, after).trimEnd();
		const rest = current.slice(after).trim();
		save(`${before ? `${before}\n\n` : ""}${block}\n${rest ? `\n${rest}\n` : ""}`);
		report.updated.push(`${file.path} (kit block added)`);
		return hash;
	}
	const currentBody = current.slice(start + blockStart.length, end).trim();
	if (currentBody === body) return hash;
	if (options.force || (lockedHash !== undefined && sha256(currentBody) === lockedHash)) {
		save(`${current.slice(0, start)}${block}${current.slice(end + blockEnd.length)}`);
		report.updated.push(file.path);
		return hash;
	}
	report.skipped.push(`${file.path} (the kit block was changed in this project; --force replaces it)`);
	return lockedHash;
}

// The text of the kit's block in a shared file, or undefined when the file has none (doctor's budgets use it).
export function kitBlockOf(text: string): string | undefined {
	const start = text.indexOf(blockStart);
	const end = text.indexOf(blockEnd, start);
	return start === -1 || end === -1 ? undefined : text.slice(start + blockStart.length, end).trim();
}

function removeStaleKitFiles(
	root: string,
	previous: Record<string, string>,
	current: Record<string, string>,
	options: ApplyOptions,
	report: Report,
) {
	for (const [path, hash] of Object.entries(previous)) {
		const dest = join(root, path);
		if (path in current || !existsSync(dest)) continue;
		if (!options.force && sha256(readFileSync(dest, "utf8")) !== hash) {
			report.skipped.push(`${path} (no longer part of the kit, but changed here, so kept)`);
			continue;
		}
		if (!options.dryRun) {
			unlinkSync(dest);
			removeEmptyParents(dirname(dest), root);
		}
		report.removed.push(path);
	}
}

function removeEmptyParents(dir: string, root: string) {
	let current = dir;
	while (current.startsWith(root) && current !== root && readdirSync(current).length === 0) {
		rmdirSync(current);
		current = dirname(current);
	}
}

// Agent instructions the kit didn't write are moved (not deleted) so project-setup can fold them into PROJECT.md.
function moveLegacyAgentFiles(root: string, report: Report, dryRun: boolean) {
	const moved: string[] = [];
	for (const path of manifest.legacyAgentFiles) {
		const full = join(root, path);
		if (!existsSync(full)) continue;
		const text = readFileSync(full, "utf8");
		moved.push(`## From ${path}\n\n${text.trim()}\n`);
		if (!dryRun) unlinkSync(full);
		report.moved.push(path);
	}
	if (!moved.length || dryRun) return;
	const legacyPath = join(root, "docs/legacy-agents.md");
	mkdirSync(dirname(legacyPath), { recursive: true });
	if (!existsSync(legacyPath)) {
		writeFileSync(
			legacyPath,
			"# Legacy agent instructions, moved here by agent-ready\n\nFold project-specific rules into PROJECT.md → Rules for agents (skill project-setup), then delete this file.\n\n",
		);
	}
	appendFileSync(legacyPath, `${moved.join("\n")}\n`);
	report.notes.push("Fold docs/legacy-agents.md into PROJECT.md, then delete it (skill project-setup)");
}

function permissionsFor(flags: Set<string>, render: (text: string) => string): PermissionLists {
	const lists: PermissionLists = { allow: [], ask: [], deny: [] };
	for (const extra of activeKeys(manifest.claudeSettings, flags)) {
		for (const kind of ["allow", "ask", "deny"] as const) lists[kind].push(...(extra[kind] ?? []).map(render));
	}
	return lists;
}

function linkSkillsAndHooks(root: string, config: ProjectKitConfig, report: Report) {
	const runner = config.runtime === "bun" ? "bun" : "node";
	const result = run(runner, ["scripts/agent/link-skills-and-hooks.ts"], root);
	if (result.code !== 0) report.notes.push(`Skill links failed: ${result.out}`);
}

// install/add/remove leave packages to the human; create installs them itself.
function noteMissingPackages(root: string, config: ProjectKitConfig, flags: Set<string>, report: Report) {
	const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
	const has = (name: string) => Boolean(pkg.dependencies?.[name] ?? pkg.devDependencies?.[name]);
	const deps = new Set<string>();
	const dev = new Set<string>();
	for (const group of activeKeys(manifest.packages, flags)) {
		for (const name of group.deps ?? []) if (!has(name)) deps.add(name);
		for (const name of group.dev ?? []) if (!has(name)) dev.add(name);
	}
	const pm = packageManagers[config.pm];
	const commands = [deps.size ? `${pm.add} ${[...deps].join(" ")}` : "", dev.size ? `${pm.addDev} ${[...dev].join(" ")}` : ""];
	if (deps.size || dev.size) report.notes.push(`Packages to add (ask the human first): ${commands.filter(Boolean).join(" && ")}`);
}
