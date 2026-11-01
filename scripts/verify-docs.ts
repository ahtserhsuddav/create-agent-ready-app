#!/usr/bin/env bun
// Checks that the official docs the templates follow haven't changed since the templates were last checked.
// Each page in template-sources.json is fetched (Markdown first), normalized and hashed. A changed hash means: read
// that page again, update the templates that follow it, run `bun run verify:build`, then accept the new hash.
// Usage: bun run verify:docs [--accept]   (exit 1 when a page changed or can't be fetched)
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";

type Sources = {
	$comment: string;
	sources: { templates: string[]; docs: string[] }[];
	verified: Record<string, { hash: string; date: string }>;
};

const path = join(import.meta.dirname, "..", "template-sources.json");
const file: Sources = JSON.parse(readFileSync(path, "utf8"));
const { values } = parseArgs({ options: { accept: { type: "boolean", default: false } } });

// Many docs sites serve Markdown at <page>.md; the HTML version is reduced to its text.
async function fetchPage(url: string): Promise<string | undefined> {
	for (const candidate of [`${url.replace(/\/$/, "")}.md`, url]) {
		const response = await fetch(candidate, { headers: { Accept: "text/markdown, text/plain;q=0.9, text/html;q=0.5" } }).catch(() => undefined);
		if (!response?.ok) continue;
		const text = await response.text();
		if (candidate.endsWith(".md") && /^\s*<(!doctype|html)/i.test(text)) continue;
		return text;
	}
	return undefined;
}

// Only the words count: markup, scripts, whitespace and build hashes change on every deploy.
function normalize(text: string): string {
	return text
		.replace(/<(script|style|svg|noscript)[\s\S]*?<\/\1>/gi, " ")
		.replace(/<[^>]+>/g, " ")
		.replace(/\b[0-9a-f]{16,}\b/gi, " ")
		.replace(/\s+/g, " ")
		.trim();
}

const urls = [...new Set(file.sources.flatMap((source) => source.docs))];
const today = new Date().toISOString().slice(0, 10);
const changed: string[] = [];
const failed: string[] = [];
await Promise.all(
	urls.map(async (url) => {
		const page = await fetchPage(url);
		if (page === undefined) {
			failed.push(url);
			return;
		}
		const hash = createHash("sha256").update(normalize(page)).digest("hex");
		const known = file.verified[url];
		if (known?.hash === hash) return;
		if (values.accept) file.verified[url] = { hash, date: today };
		else changed.push(url);
	}),
);

if (values.accept) {
	writeFileSync(path, `${JSON.stringify(file, null, "\t")}\n`);
	console.log(`verify:docs: recorded ${urls.length - failed.length} pages as checked on ${today}`);
}
for (const url of changed) {
	const templates = file.sources.filter((source) => source.docs.includes(url)).flatMap((source) => source.templates);
	console.log(`changed: ${url}\n  re-check: ${templates.join(", ")}`);
}
for (const url of failed) console.log(`unreachable: ${url} (moved? update template-sources.json)`);
if (!changed.length && !failed.length && !values.accept) console.log(`verify:docs: all ${urls.length} pages match the checked versions`);
process.exit(changed.length || failed.length ? 1 : 0);
