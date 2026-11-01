#!/usr/bin/env node
// Fails when files outside a Big change's Scope were changed. Quick changes have no task file, so nothing to check.
// Usage: {{run}} scope [tasks/<file>.md] [--base main]
// Without a task file it checks every task marked "Status: in progress" that this branch touches.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { matchesAny } from "./glob-match.ts";
import { changedFiles, git, isMain } from "./project-info.ts";

// Always allowed: bookkeeping and generated files.
const alwaysAllowed = ["CHANGELOG.md", "tasks/**", "docs/official/INDEX.md", "src/routeTree.gen.ts", "next-env.d.ts", "PROJECT.md"];

// Scope globs: comma-separated on the "Scope:" line and/or one per "- " line below it, up to the next "Name:" line.
export function readScope(taskText: string): string[] {
	const match = taskText.match(/^Scope:([^\n]*)\n([\s\S]*?)(?=^\w[\w ]*:|$(?![\s\S]))/m);
	const entries = [...(match?.[1]?.split(",") ?? []), ...(match?.[2]?.split("\n") ?? [])];
	return entries.map((entry) => entry.replace(/^\s*-\s*/, "").replace(/`/g, "").trim()).filter(Boolean);
}

function defaultBase(root: string): string | undefined {
	return ["origin/main", "main"].find((ref) => git(root, ["rev-parse", "--verify", "--quiet", ref]) !== undefined);
}

export function checkScope(root: string, taskPaths: string[], base?: string) {
	const changed = changedFiles(root, base);
	const tasks = taskPaths.length
		? taskPaths
		: (existsSync(join(root, "tasks")) ? readdirSync(join(root, "tasks")) : [])
				.map((file) => `tasks/${file}`)
				.filter((path) => path.endsWith(".md") && changed.includes(path))
				.filter((path) => /^Status:\s*in progress/m.test(readFileSync(join(root, path), "utf8")));
	if (!tasks.length) return { tasks, outside: [] as string[] };
	const scope = tasks.flatMap((path) => readScope(readFileSync(join(root, path), "utf8")));
	const outside = changed.filter((path) => !matchesAny(path, [...scope, ...alwaysAllowed]));
	return { tasks, outside };
}

if (isMain(import.meta.url)) {
	const { values, positionals } = parseArgs({ allowPositionals: true, options: { base: { type: "string" } } });
	const root = process.cwd();
	const { tasks, outside } = checkScope(root, positionals, values.base ?? defaultBase(root));
	if (!tasks.length) console.log("scope: no Big change in progress, nothing to check");
	else if (!outside.length) console.log(`scope: ok (${tasks.join(", ")})`);
	else {
		console.error(`scope: ${outside.length} changed file(s) outside the Scope of ${tasks.join(", ")}:`);
		for (const path of outside) console.error(`  ${path}`);
		console.error("Add them to Scope with a Log line saying why, or undo those changes.");
		process.exit(1);
	}
}
