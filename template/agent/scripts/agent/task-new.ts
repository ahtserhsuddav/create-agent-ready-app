#!/usr/bin/env node
// Creates the task file for a Big change (tasks/<date>-<slug>.md, at most 15 lines) and prints its path.
// Usage: {{run}} task:new "<title>" --by <agent> [--scope "<glob>"]...
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { agentName, gitUser, isMain, today } from "./project-info.ts";

export function createTask(root: string, title: string, options: { by?: string; scope?: string[] } = {}): string {
	const slug =
		title
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-|-$/g, "")
			.slice(0, 50) || "task";
	let path = `tasks/${today()}-${slug}.md`;
	for (let copy = 2; existsSync(join(root, path)); copy++) path = `tasks/${today()}-${slug}-${copy}.md`;
	const scope = options.scope?.length ? options.scope : [""];
	const lines = [
		`# ${title}`,
		`Status: in progress · Owner: ${gitUser(root)} (${agentName(options.by)}) · Started: ${today()}`,
		"",
		"Goal: ",
		"Scope:",
		...scope.map((glob) => `- ${glob}`),
		"Steps:",
		"- [ ] ",
		"Log:",
		`- ${today()} started`,
	];
	mkdirSync(join(root, "tasks"), { recursive: true });
	writeFileSync(join(root, path), `${lines.join("\n")}\n`);
	return path;
}

if (isMain(import.meta.url)) {
	const { values, positionals } = parseArgs({
		allowPositionals: true,
		options: { by: { type: "string" }, scope: { type: "string", multiple: true } },
	});
	const title = positionals.join(" ").trim();
	if (!title) {
		console.error('Usage: {{run}} task:new "<title>" --by <agent> [--scope "<glob>"]...');
		process.exit(1);
	}
	console.log(createTask(process.cwd(), title, values));
}
