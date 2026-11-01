// Renders a kit template for one project: keeps {{#flag}} blocks whose flag is on, keeps {{^flag}} blocks whose flag
// is off, and fills {{variables}}. Multi-line block markers sit alone on a line and may be wrapped as a comment
// (// # <!-- -->); short blocks can also open and close inside one line: `text{{#db}} more text{{/db}}`, and nest
// there (`{{#server}}a {{#next}}b{{/next}}{{/server}}`).
const markerLine = /^\s*(?:\/\/|#|<!--)?\s*\{\{([#^/])([\w-]+)\}\}\s*(?:-->)?\s*$/;
const inlineBlock = /\{\{([#^])([\w-]+)\}\}(.*?)\{\{\/\2\}\}/g;

export function renderTemplate(text: string, flags: Set<string>, vars: Record<string, string>): string {
	const kept: string[] = [];
	const open: { name: string; visible: boolean }[] = [];
	for (const line of text.split("\n")) {
		const marker = line.match(markerLine);
		if (!marker) {
			if (open.every((block) => block.visible)) kept.push(line);
			continue;
		}
		const [, kind, name] = marker as unknown as [string, string, string];
		if (kind === "/") {
			const closed = open.pop();
			if (closed?.name !== name) throw new Error(`{{/${name}}} closes ${closed ? `{{${closed.name}}}` : "no block"}`);
			continue;
		}
		const parentVisible = open.every((block) => block.visible);
		open.push({ name, visible: parentVisible && (kind === "#") === flags.has(name) });
	}
	if (open.length) throw new Error(`{{${open.at(-1)?.name}}} is never closed`);
	// Each pass resolves the outermost inline blocks; repeat until nested ones are gone too.
	let blocks = kept.join("\n");
	for (let previous = ""; previous !== blocks; ) {
		previous = blocks;
		blocks = blocks.replace(inlineBlock, (_match, kind: string, name: string, body: string) => ((kind === "#") === flags.has(name) ? body : ""));
	}
	const rendered = blocks.replace(/\{\{(\w+)\}\}/g, (match, key: string) => vars[key] ?? match);
	const leftover = rendered.match(/\{\{[#^/][\w-]+\}\}/);
	if (leftover) throw new Error(`${leftover[0]} has no partner on the same line (inline blocks can't span lines)`);
	return rendered;
}
