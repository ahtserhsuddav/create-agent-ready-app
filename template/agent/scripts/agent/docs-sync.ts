#!/usr/bin/env node
// Builds docs/official/INDEX.md from package.json: each dependency's installed version, its official docs, a local
// copy of its llms.txt index, skills shipped inside the package, and docs MCP servers. Idempotent.
// Usage: {{run}} docs:sync [--refresh]   (--refresh re-downloads every llms.txt index)
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { parseArgs } from "node:util";
import { flagsOf, isMain, readKitConfig, today } from "./project-info.ts";

type Source = { docs?: string; llms?: string | Record<string, string>; mcp?: string; skill?: string; note?: string; when?: string };
type Sources = { ignore?: string[]; platform?: Record<string, Source>; packages?: Record<string, Source> };
type Row = { name: string; version: string; docs: string; index: string; skills: string; also: string };
export type FetchText = (url: string) => Promise<string | undefined>;

const maxIndexAgeDays = 14;

const defaultFetch: FetchText = async (url) => {
	const response = await fetch(url, { headers: { Accept: "text/markdown, text/plain, application/json" } });
	return response.ok ? response.text() : undefined;
};

export const cachePathFor = (url: string) => {
	const parsed = new URL(url);
	return `docs/official/cache/${parsed.host}${parsed.pathname.replace(/\/$/, "/index")}`;
};

function installedVersion(root: string, name: string): string | undefined {
	const path = join(root, "node_modules", name, "package.json");
	return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")).version : undefined;
}

function countSkills(dir: string): number {
	return readdirSync(dir, { withFileTypes: true }).reduce(
		(count, entry) => count + (entry.isDirectory() ? countSkills(join(dir, entry.name)) : entry.name === "SKILL.md" ? 1 : 0),
		0,
	);
}

function shippedSkills(root: string, name: string): string {
	const dir = join(root, "node_modules", name, "skills");
	return existsSync(dir) ? `${countSkills(dir)} in node_modules/${name}/skills/` : "-";
}

function llmsUrl(llms: Source["llms"], version: string): string | undefined {
	if (typeof llms !== "object") return llms;
	const minor = version.split(".").slice(0, 2).join(".");
	return llms[minor] ?? llms.latest;
}

async function localIndex(root: string, url: string | undefined, refresh: boolean, fetchText: FetchText): Promise<string> {
	if (!url) return "-";
	const relative = cachePathFor(url);
	const path = join(root, relative);
	const ageDays = existsSync(path) ? (Date.now() - statSync(path).mtimeMs) / 86_400_000 : Number.POSITIVE_INFINITY;
	if (!refresh && ageDays < maxIndexAgeDays) return relative;
	const text = await fetchText(url).catch(() => undefined);
	if (text === undefined) return existsSync(path) ? relative : `- (download failed: ${url})`;
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, text);
	return relative;
}

async function npmHomepage(name: string, fetchText: FetchText): Promise<string> {
	const text = await fetchText(`https://registry.npmjs.org/${name}/latest`).catch(() => undefined);
	if (!text) return "?";
	const meta = JSON.parse(text);
	const repo = typeof meta.repository === "string" ? meta.repository : meta.repository?.url;
	return meta.homepage ?? repo?.replace(/^git\+/, "").replace(/\.git$/, "") ?? "?";
}

function compatibilityDate(root: string): string {
	for (const file of ["wrangler.jsonc", "wrangler.json", "wrangler.toml"]) {
		const path = join(root, file);
		const date = existsSync(path) ? readFileSync(path, "utf8").match(/compatibility_date"?\s*[:=]\s*"([^"]+)"/)?.[1] : undefined;
		if (date) return `compat ${date}`;
	}
	return "-";
}

export async function syncDocs(root: string, options: { refresh?: boolean; fetchText?: FetchText } = {}) {
	const fetchText = options.fetchText ?? defaultFetch;
	const refresh = Boolean(options.refresh);
	const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
	const sourcesPath = join(root, "docs/official/sources.json");
	const sources: Sources = existsSync(sourcesPath) ? JSON.parse(readFileSync(sourcesPath, "utf8")) : {};
	const kit = readKitConfig(root);
	const flags = flagsOf(kit);
	const rows: Row[] = [];
	const unverified: string[] = [];

	for (const [name, source] of Object.entries(sources.platform ?? {})) {
		if (source.when && !source.when.split("+").every((flag) => flags.has(flag))) continue;
		const version = name === "bun" ? (process.versions.bun ?? "-") : name === "node" ? process.version : name === "cloudflare-workers" ? compatibilityDate(root) : "-";
		rows.push(await rowFor(root, name, version, source, refresh, fetchText, "-"));
	}
	const names = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
		.filter((name) => !(sources.ignore ?? []).some((prefix) => name.startsWith(prefix)))
		.sort();
	for (const name of names) {
		const version = installedVersion(root, name) ?? "not installed";
		const source = sources.packages?.[name];
		if (source) {
			rows.push(await rowFor(root, name, version, source, refresh, fetchText, shippedSkills(root, name)));
			continue;
		}
		unverified.push(name);
		const docs = await npmHomepage(name, fetchText);
		rows.push({ name, version, docs, index: "-", skills: shippedSkills(root, name), also: "**unverified**: confirm the official docs, add to sources.json" });
	}

	const table = rows.map((row) => `| ${row.name} | ${row.version} | ${row.docs} | ${row.index} | ${row.skills} | ${row.also} |`);
	const index = [
		`# Official docs index — generated by \`{{run}} docs:sync\` on ${today()}; don't edit. Sources: \`docs/official/sources.json\``,
		"Find a package: `rg \"<package>\" docs/official/INDEX.md`. Search a local index with rg; fetch one page with `{{run}} docs:get <url>`.",
		"",
		"| Package | Installed | Docs | Local llms index | Skills in package | Also |",
		"| --- | --- | --- | --- | --- | --- |",
		...table,
		"",
	].join("\n");
	mkdirSync(join(root, "docs/official"), { recursive: true });
	writeFileSync(join(root, "docs/official/INDEX.md"), index);
	return { rows, unverified };
}

async function rowFor(root: string, name: string, version: string, source: Source, refresh: boolean, fetchText: FetchText, skills: string): Promise<Row> {
	const also = [
		source.skill ? `skill: ${source.skill}` : "",
		source.mcp ? `mcp: ${source.mcp}` : "",
		source.note ?? "",
	].filter(Boolean);
	return {
		name,
		version,
		docs: source.docs ?? "-",
		index: await localIndex(root, llmsUrl(source.llms, version), refresh, fetchText),
		skills,
		also: also.join(" · ") || "-",
	};
}

if (isMain(import.meta.url)) {
	const { values } = parseArgs({ options: { refresh: { type: "boolean" } } });
	const { rows, unverified } = await syncDocs(process.cwd(), { refresh: values.refresh });
	const note = unverified.length ? ` (${unverified.length} unverified: ${unverified.join(", ")})` : "";
	console.log(`docs:sync: ${rows.length} rows${note} → docs/official/INDEX.md`);
}
