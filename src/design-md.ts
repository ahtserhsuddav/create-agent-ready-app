// awesome-design-md (VoltAgent, MIT): 80+ DESIGN.md files that describe well-known sites' design languages in Google
// Stitch's format (design tokens, then rules for color, type, components, layout and responsive behavior). Picking one
// at create time copies it to design/DESIGN.md as the project's starting point; the website-design skill builds on it.
const repo = "VoltAgent/awesome-design-md";
const headers = { Accept: "application/vnd.github+json", "User-Agent": "create-agent-ready-app" };

export type Fetcher = (url: string, init?: { headers?: Record<string, string> }) => Promise<Response>;

export type DesignEntry = { name: string; label: string; description: string };

// The README's "Collection" lists every entry as `- [**Label**](https://getdesign.md/<name>/design-md) - description`.
export function parseCatalog(readme: string): DesignEntry[] {
	return readme.split("\n").flatMap((line) => {
		const [, label, name, description] = line.match(/^- \[\*\*(.+?)\*\*\]\(https:\/\/getdesign\.md\/([a-z0-9.-]+)\/design-md\)\s*-\s*(.+)$/) ?? [];
		return label && name && description ? [{ label, name, description: description.trim() }] : [];
	});
}

// The catalog with each entry's one-line description; the folder listing is the fallback if the README changes shape.
export async function listDesigns(fetcher: Fetcher = fetch): Promise<DesignEntry[]> {
	const readme = await fetcher(`https://raw.githubusercontent.com/${repo}/main/README.md`, { headers });
	const entries = readme.ok ? parseCatalog(await readme.text()) : [];
	if (entries.length) return entries.sort((a, b) => a.label.localeCompare(b.label));
	const response = await fetcher(`https://api.github.com/repos/${repo}/contents/design-md`, { headers });
	if (!response.ok) throw new Error(`GitHub answered ${response.status} for the awesome-design-md catalog`);
	const folders = (await response.json()) as { name: string; type: string }[];
	return folders
		.filter((folder) => folder.type === "dir")
		.map((folder) => ({ name: folder.name, label: folder.name, description: "" }))
		.sort((a, b) => a.name.localeCompare(b.name));
}

export async function fetchDesign(name: string, fetcher: Fetcher = fetch): Promise<string> {
	if (!/^[a-z0-9.-]+$/.test(name)) throw new Error(`"${name}" is not an awesome-design-md entry name`);
	const response = await fetcher(`https://raw.githubusercontent.com/${repo}/main/design-md/${name}/DESIGN.md`);
	if (!response.ok) throw new Error(`No DESIGN.md for "${name}" in awesome-design-md (${response.status})`);
	return response.text();
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
