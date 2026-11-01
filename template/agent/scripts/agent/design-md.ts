#!/usr/bin/env node
// awesome-design-md (VoltAgent, MIT): DESIGN.md files that describe well-known sites' design languages in Google
// Stitch's format. `list` prints the catalog by category with each entry's one-line description, so you can propose
// the few that fit the brief; `use <name>` copies one to design/DESIGN.md as the project's starting point, credited.
// Usage: {{run}} design:md list [--category <word>] · {{run}} design:md use <name> [--force]
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { isMain } from "./project-info.ts";

type Fetcher = (url: string) => Promise<Response>;
export type DesignEntry = { name: string; label: string; category: string; description: string };

const repo = "VoltAgent/awesome-design-md";
const raw = `https://raw.githubusercontent.com/${repo}/main`;
const designPath = "design/DESIGN.md";

// The README's "Collection" lists every entry as `- [**Label**](https://getdesign.md/<name>/design-md) - description`
// under a `### Category` heading.
export function parseCatalog(readme: string): DesignEntry[] {
	const entries: DesignEntry[] = [];
	let category = "";
	for (const line of readme.split("\n")) {
		const heading = line.match(/^###\s+(.+)/)?.[1];
		if (heading) category = heading.trim();
		const [, label, name, description] = line.match(/^- \[\*\*(.+?)\*\*\]\(https:\/\/getdesign\.md\/([a-z0-9.-]+)\/design-md\)\s*-\s*(.+)$/) ?? [];
		if (label && name && description) entries.push({ label, name, category, description: description.trim() });
	}
	return entries;
}

export async function listDesigns(fetcher: Fetcher = fetch): Promise<DesignEntry[]> {
	const response = await fetcher(`${raw}/README.md`);
	if (!response.ok) throw new Error(`GitHub answered ${response.status} for the awesome-design-md catalog`);
	return parseCatalog(await response.text());
}

// The file the project gets: the source credited, and a reminder that it's a starting point, not a brand to copy.
export function designFileText(name: string, markdown: string): string {
	const credit =
		`<!-- Starting point: the "${name}" design language from awesome-design-md (MIT, https://github.com/${repo}).\n` +
		"     Make it this project's own: replace any brand names, logos and trademarks, then adjust it (skill website-design). -->";
	const body = markdown.startsWith("---")
		? markdown.replace(/^---\n[\s\S]*?\n---\n/, (front) => `${front}\n${credit}\n`).trimEnd()
		: `${credit}\n\n${markdown.trim()}`;
	return `${body}\n\n${projectSections(name)}`;
}

// The sections skill website-design fills in for this project, after the catalog entry's own.
const projectSections = (name: string) =>
	[
		"## Brief (from the human)",
		"- What and for whom:",
		"- Feel, in three words:",
		"- Must avoid:",
		"",
		"## References (images in `design/references/`; one line each: source → take · avoid)",
		"- (none yet)",
		"",
		"## Design inputs (skill website-design fills these in order before any page is built)",
		'- References: (the human\'s images, links and documents, or "none")',
		`- Base: awesome-design-md "${name}"`,
		"- Direction: (taste-skill's direction and why)",
		"- Reference sites: (2–3 live sites studied for this site's needs)",
		"",
	].join("\n");

// The kit's empty template still has blank colour tokens; anything else is the project's design and needs --force.
export const isUntouched = (text: string) => /^\s*primary: ""\s*$/m.test(text);

export async function useDesign(root: string, name: string, options: { force?: boolean; fetcher?: Fetcher } = {}) {
	if (!/^[a-z0-9.-]+$/.test(name)) throw new Error(`"${name}" is not an awesome-design-md entry name`);
	const path = join(root, designPath);
	if (existsSync(path) && !isUntouched(readFileSync(path, "utf8")) && !options.force) {
		throw new Error(`${designPath} already holds this project's design. Ask the human, then rerun with --force to replace it.`);
	}
	const response = await (options.fetcher ?? fetch)(`${raw}/design-md/${name}/DESIGN.md`);
	if (!response.ok) throw new Error(`No DESIGN.md for "${name}" in awesome-design-md (${response.status})`);
	writeFileSync(path, designFileText(name, await response.text()));
	return designPath;
}

if (isMain(import.meta.url)) {
	const { values, positionals } = parseArgs({
		allowPositionals: true,
		options: { force: { type: "boolean" }, category: { type: "string" } },
	});
	const [command, name] = positionals;
	try {
		if (command === "list") {
			const filter = values.category?.toLowerCase();
			const entries = (await listDesigns()).filter((entry) => !filter || entry.category.toLowerCase().includes(filter));
			let category = "";
			for (const entry of entries) {
				if (entry.category !== category) console.log(`\n## ${(category = entry.category)}`);
				console.log(`- ${entry.name}: ${entry.description}`);
			}
			console.log(`\n${entries.length} entries. Propose 2-3 that fit the brief, then: {{run}} design:md use <name>`);
		} else if (command === "use" && name) {
			const path = await useDesign(process.cwd(), name, { force: values.force });
			console.log(`✓ ${path} now starts from "${name}". Replace its brand names, then fill Design inputs (skill website-design).`);
		} else {
			console.error("Usage: {{run}} design:md list [--category <word>] · {{run}} design:md use <name> [--force]");
			process.exit(1);
		}
	} catch (error) {
		console.error(`✗ ${(error as Error).message}`);
		process.exit(1);
	}
}
