#!/usr/bin/env node
// Appends one line to CHANGELOG.md: when, who (git user + agent), which areas changed, what, and the task file.
// Usage: {{run}} log "<what changed>" --by <agent> [--task tasks/<file>.md]
import { appendFileSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { agentName, areaOf, changedFiles, gitUser, isMain, nowStamp } from "./project-info.ts";

const header =
	"# CHANGELOG — one line per finished change, newest last. Written by `{{run}} log`; don't edit by hand.\n<!-- date time · who (agent) · area · what · task -->\n";

// Features first, then the other src/ folders, then everything else: the most telling areas fit in the line.
const rank = (path: string) => (path.startsWith("src/features/") ? 0 : path.startsWith("src/") ? 1 : 2);

export function logChange(root: string, summary: string, options: { by?: string; task?: string } = {}): string {
	const changed = changedFiles(root)
		.filter((file) => file !== "CHANGELOG.md" && !file.startsWith("tasks/"))
		.sort((a, b) => rank(a) - rank(b));
	const areas = [...new Set(changed.map(areaOf))].slice(0, 4);
	const parts = [nowStamp(), `${gitUser(root)} (${agentName(options.by)})`, areas.join(", ") || "-", summary.trim()];
	if (options.task) parts.push(options.task);
	const line = `- ${parts.join(" · ")}`;
	const path = join(root, "CHANGELOG.md");
	if (!existsSync(path)) writeFileSync(path, header);
	appendFileSync(path, `${line}\n`);
	return line;
}

if (isMain(import.meta.url)) {
	const { values, positionals } = parseArgs({
		allowPositionals: true,
		options: { by: { type: "string" }, task: { type: "string" } },
	});
	const summary = positionals.join(" ").trim();
	if (!summary) {
		console.error('Usage: {{run}} log "<what changed>" --by <agent> [--task tasks/<file>.md]');
		process.exit(1);
	}
	console.log(logChange(process.cwd(), summary, values));
}
