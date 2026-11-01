// Merges kit entries into files the project owns: package.json scripts, .gitignore, .gitattributes, tsconfig flags,
// the Biome "extends" link, Claude Code permissions and the official-docs sources list. Project entries are kept.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { type PermissionLists, writeJson } from "./kit-config";
import type { Report } from "./report";
import { run } from "./run";

const permissionKinds = ["allow", "ask", "deny"] as const;

function writeJsonLike(path: string, original: string, value: unknown) {
	const indent = /\n\t"/.test(original) ? "\t" : 2;
	writeFileSync(path, `${JSON.stringify(value, null, indent)}\n`);
}

// Kit commands win over same-named project scripts (the old value is reported), except "add only" names like test.
// `remove` lists scaffold scripts the kit's own commands replace (create only).
export function mergePackageScripts(
	root: string,
	desired: Record<string, string>,
	remove: string[],
	addOnly: string[],
	previous: Record<string, string>,
	report: Report,
	dryRun: boolean,
	quiet = false,
): Record<string, string> {
	const path = join(root, "package.json");
	const original = readFileSync(path, "utf8");
	const pkg = JSON.parse(original);
	const scripts: Record<string, string> = pkg.scripts ?? {};
	const written: Record<string, string> = {};
	let changed = false;
	for (const [name, command] of Object.entries(desired)) {
		const current = scripts[name];
		if (current === command) {
			written[name] = command;
			continue;
		}
		if (current !== undefined && previous[name] !== current && addOnly.includes(name)) {
			report.notes.push(`package.json "${name}" kept as "${current}" (kit default: "${command}")`);
			continue;
		}
		if (current !== undefined && previous[name] !== current && !quiet) {
			report.notes.push(`package.json "${name}" was "${current}", now the kit command "${command}"`);
		}
		scripts[name] = command;
		written[name] = command;
		changed = true;
		report.updated.push(`package.json script "${name}"`);
	}
	for (const [name, command] of Object.entries(previous)) {
		if (name in desired || scripts[name] !== command) continue;
		delete scripts[name];
		changed = true;
		report.removed.push(`package.json script "${name}"`);
	}
	for (const name of remove) {
		if (name in desired || !(name in scripts)) continue;
		delete scripts[name];
		changed = true;
		report.removed.push(`package.json script "${name}"`);
	}
	if (changed && !dryRun) writeJsonLike(path, original, { ...pkg, scripts });
	return written;
}

export function appendMissingLines(path: string, lines: string[], label: string, report: Report, dryRun: boolean) {
	const current = existsSync(path) ? readFileSync(path, "utf8") : "";
	const present = new Set(current.split("\n").map((line) => line.trim()));
	const missing = lines.filter((line) => !present.has(line.trim()));
	if (!missing.length) return;
	if (!dryRun) {
		const separator = current === "" || current.endsWith("\n\n") ? "" : current.endsWith("\n") ? "\n" : "\n\n";
		writeFileSync(path, `${current}${separator}${missing.join("\n")}\n`);
	}
	report.updated.push(`${label} (+${missing.length} lines)`);
}

// Text insertion keeps the comments tsconfig.json often has.
export function addTsconfigFlags(path: string, flags: string[], report: Report, dryRun: boolean) {
	if (!existsSync(path)) {
		report.notes.push(`No tsconfig.json: add ${flags.join(", ")} when you create one`);
		return;
	}
	let text = readFileSync(path, "utf8");
	const missing = flags.filter((flag) => !new RegExp(`"${flag}"\\s*:`).test(text));
	if (!missing.length) return;
	const anchor = text.match(/"compilerOptions"\s*:\s*\{\s*\n(\s*)/);
	if (!anchor || anchor.index === undefined) {
		report.notes.push(`tsconfig.json: add ${missing.join(", ")} to compilerOptions`);
		return;
	}
	const indent = anchor[1] ?? "  ";
	const insertAt = anchor.index + anchor[0].length;
	text = `${text.slice(0, insertAt)}${missing.map((flag) => `"${flag}": true,\n${indent}`).join("")}${text.slice(insertAt)}`;
	if (!dryRun) writeFileSync(path, text);
	report.updated.push(`tsconfig.json (+${missing.join(", ")})`);
}

// Community skills can ship scripts (.ts, .js) in .agents/skills/: they're their makers' code, so TypeScript leaves
// them out. Adds the folders to tsconfig's "exclude" (with node_modules, which a custom exclude list must name).
export function excludeFromTsconfig(path: string, folders: string[], report: Report, dryRun: boolean) {
	if (!existsSync(path)) return;
	let text = readFileSync(path, "utf8");
	const existing = text.match(/"exclude"\s*:\s*\[([^\]]*)\]/);
	const listed = existing ? [...(existing[1] ?? "").matchAll(/"([^"]+)"/g)].map((match) => match[1] ?? "") : [];
	const wanted = [...(existing ? [] : ["node_modules"]), ...folders].filter((folder) => !listed.includes(folder));
	if (!wanted.length) return;
	const entries = [...listed, ...wanted].map((folder) => `"${folder}"`).join(", ");
	if (existing) text = text.replace(existing[0], `"exclude": [${entries}]`);
	else {
		const closing = text.lastIndexOf("}");
		if (closing === -1) return;
		text = `${text.slice(0, closing).trimEnd()},\n  "exclude": [${entries}]\n}\n`;
	}
	if (!dryRun) writeFileSync(path, text);
	report.updated.push(`tsconfig.json (exclude ${wanted.join(", ")})`);
}

// The kit's lint rules (import boundaries, no unused code) live in .agents/biome.kit.json; biome.json extends it.
// Biome also reads .gitignore, so build output (a prerendered dist/index.html), caches and docs copies aren't linted.
export function ensureBiomeExtends(path: string, report: Report, dryRun: boolean) {
	const kitConfig = "./.agents/biome.kit.json";
	const vcs = { enabled: true, clientKind: "git", useIgnoreFile: true };
	if (!existsSync(path)) {
		if (!dryRun) writeJson(path, { extends: [kitConfig], vcs });
		report.created.push("biome.json");
		return;
	}
	const original = readFileSync(path, "utf8");
	let config: Record<string, unknown> & { extends?: string[]; vcs?: Record<string, unknown> };
	try {
		config = JSON.parse(original);
	} catch {
		report.notes.push(`biome.json isn't plain JSON: add "extends": ["${kitConfig}"] and vcs.useIgnoreFile by hand`);
		return;
	}
	const changes: string[] = [];
	if (!config.extends?.includes(kitConfig)) {
		const { $schema, ...rest } = config;
		config = { ...($schema ? { $schema } : {}), extends: [...(config.extends ?? []), kitConfig], ...rest };
		changes.push("extends the kit rules");
	}
	if (config.vcs?.enabled !== true || config.vcs?.useIgnoreFile !== true) {
		config.vcs = { ...config.vcs, ...vcs };
		changes.push("respects .gitignore");
	}
	if (!changes.length) return;
	if (!dryRun) {
		writeJsonLike(path, original, config);
		// Leave the file in Biome's own style so `bun run lint` stays clean.
		const biome = join(dirname(path), "node_modules/.bin/biome");
		if (existsSync(biome)) run(biome, ["format", "--write", path], dirname(path));
	}
	report.updated.push(`biome.json (${changes.join(", ")})`);
}

// Adds the kit's permissions, removes ones the kit added before but no longer wants, keeps everything else.
export function mergeClaudeSettings(
	root: string,
	desired: PermissionLists,
	previous: PermissionLists,
	report: Report,
	dryRun: boolean,
): PermissionLists {
	const path = join(root, ".claude/settings.json");
	const settings = existsSync(path)
		? JSON.parse(readFileSync(path, "utf8"))
		: { $schema: "https://json.schemastore.org/claude-code-settings.json" };
	const permissions = settings.permissions ?? {};
	let changed = !existsSync(path);
	for (const kind of permissionKinds) {
		const current: string[] = permissions[kind] ?? [];
		const kept = current.filter((entry) => desired[kind].includes(entry) || !previous[kind].includes(entry));
		const added = desired[kind].filter((entry) => !kept.includes(entry));
		if (added.length || kept.length !== current.length) changed = true;
		permissions[kind] = [...kept, ...added];
	}
	if (changed) {
		if (!dryRun) writeJson(path, { ...settings, permissions });
		report.updated.push(".claude/settings.json (permissions)");
	}
	return desired;
}

// `tsr generate` (used by `bun run typecheck`) must write the same route tree as Start's Vite plugin, which appends
// a Start type registration. TanStack's generator option routeTreeFileFooter adds it; without it, server routes
// don't typecheck until the next `vite dev` or `vite build`.
export function ensureRouteTreeFooter(root: string, footer: string, report: Report, dryRun: boolean) {
	const path = join(root, "tsr.config.json");
	const pkgText = readFileSync(join(root, "package.json"), "utf8");
	if (!pkgText.includes('"@tanstack/react-start"')) return;
	const original = existsSync(path) ? readFileSync(path, "utf8") : "";
	const config = original ? JSON.parse(original) : { target: "react" };
	if (config.routeTreeFileFooter) return;
	config.routeTreeFileFooter = [footer];
	if (!dryRun) writeJsonLike(path, original || "  ", config);
	report.updated.push("tsr.config.json (route tree footer for TanStack Start types)");
}

// Adds packages the kit knows and the project doesn't; the project's own entries always win.
export function mergeSourcesJson(root: string, path: string, kitText: string, report: Report, dryRun: boolean) {
	const dest = join(root, path);
	if (!existsSync(dest)) {
		if (!dryRun) writeJson(dest, JSON.parse(kitText));
		report.created.push(path);
		return;
	}
	const original = readFileSync(dest, "utf8");
	const project = JSON.parse(original);
	const kit = JSON.parse(kitText);
	let added = 0;
	for (const section of ["packages", "platform"] as const) {
		project[section] ??= {};
		for (const [name, entry] of Object.entries(kit[section] ?? {})) {
			if (project[section][name]) continue;
			project[section][name] = entry;
			added++;
		}
	}
	const ignore = new Set([...(project.ignore ?? []), ...(kit.ignore ?? [])]);
	if (ignore.size !== (project.ignore ?? []).length) added++;
	project.ignore = [...ignore];
	if (!added) return;
	if (!dryRun) writeJsonLike(dest, original, project);
	report.updated.push(`${path} (+${added} entries)`);
}
