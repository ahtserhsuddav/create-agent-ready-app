#!/usr/bin/env node
// Fetches one official docs page as Markdown into docs/official/cache/, then prints its path, length and heading
// outline with line numbers, so you read only the section you need. A cached copy is reused for 14 days.
// Usage: {{run}} docs:get <url> [--refresh]
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { parseArgs } from "node:util";
import { isMain } from "./project-info.ts";

type Fetcher = (url: string) => Promise<Response>;
const maxAgeDays = 14;

function cachePath(url: URL): string {
	const path = url.pathname.replace(/\/+$/, "") || "/index";
	return `docs/official/cache/${url.host}${/\.(md|txt)$/.test(path) ? path : `${path}.md`}`;
}

// Many docs sites serve Markdown at <page>.md or <page>/index.md; plain HTML is the last resort.
function candidates(url: URL): string[] {
	if (/\.(md|txt)$/.test(url.pathname)) return [url.href];
	const base = url.href.replace(/\/+$/, "");
	return [`${base}.md`, `${base}/index.md`, url.href];
}

const looksLikeHtml = (text: string) => /^\s*<(!doctype|html)/i.test(text);

export function htmlToText(html: string): string {
	return html
		.replace(/<(script|style|nav|header|footer|svg|noscript)[\s\S]*?<\/\1>/gi, "")
		.replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_match, level: string, text: string) => `\n\n${"#".repeat(Number(level))} ${text}\n\n`)
		.replace(/<li[^>]*>/gi, "\n- ")
		.replace(/<(br|\/p|\/div|\/pre|\/tr)[^>]*>/gi, "\n")
		.replace(/<[^>]+>/g, "")
		.replace(/&nbsp;/g, " ")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&amp;/g, "&")
		.replace(/\n{3,}/g, "\n\n")
		.trim();
}

async function download(url: URL, fetcher: Fetcher): Promise<string> {
	const urls = candidates(url);
	for (const candidate of urls) {
		const response = await fetcher(candidate).catch(() => undefined);
		if (!response?.ok) continue;
		const text = await response.text();
		if (!looksLikeHtml(text)) return text;
		if (candidate === urls.at(-1)) return htmlToText(text);
	}
	throw new Error(`Could not fetch ${url.href}`);
}

export async function getDocsPage(root: string, address: string, options: { refresh?: boolean; fetcher?: Fetcher } = {}) {
	const url = new URL(address);
	const relative = cachePath(url);
	const path = join(root, relative);
	const fresh = existsSync(path) && (Date.now() - statSync(path).mtimeMs) / 86_400_000 < maxAgeDays;
	if (!fresh || options.refresh) {
		const text = await download(url, options.fetcher ?? ((target) => fetch(target, { headers: { Accept: "text/markdown, text/plain;q=0.9, text/html;q=0.5" } })));
		mkdirSync(dirname(path), { recursive: true });
		writeFileSync(path, text.endsWith("\n") ? text : `${text}\n`);
	}
	const lines = readFileSync(path, "utf8").split("\n");
	const outline = lines.flatMap((line, index) => (/^#{1,4} /.test(line) ? [`L${index + 1} ${line}`] : [])).slice(0, 60);
	return { path: relative, lines: lines.length, cached: fresh && !options.refresh, outline };
}

if (isMain(import.meta.url)) {
	const { values, positionals } = parseArgs({ allowPositionals: true, options: { refresh: { type: "boolean" } } });
	const address = positionals[0];
	if (!address) {
		console.error("Usage: {{run}} docs:get <url> [--refresh]");
		process.exit(1);
	}
	try {
		const page = await getDocsPage(process.cwd(), address, { refresh: values.refresh });
		console.log(`${page.path} (${page.lines} lines, ${page.cached ? "cached" : "fetched"})`);
		console.log(page.outline.join("\n") || "(no headings)");
		console.log("Read only the section you need (offset = its line number).");
	} catch (error) {
		console.error(`✗ ${(error as Error).message}`);
		process.exit(1);
	}
}
