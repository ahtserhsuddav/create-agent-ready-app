#!/usr/bin/env node
// Creates src/features/<name>/ from scripts/agent/templates/feature/ (already matched to this project's add-ons),
// wires its tables and API routes in at the "agent-ready:" markers, creates the task file, and prints every path.
// Usage: {{run}} new:feature <name> [--item <singular>] [--content] [--no-db] [--no-task] [--by <agent>]
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { parseArgs } from "node:util";
import { isMain, readKitConfig, run } from "./project-info.ts";
import { createTask } from "./task-new.ts";

const templatesDir = join(import.meta.dirname, "templates/feature");
const tablesFile = "src/server/db/drizzle/tables.ts";
const apiFile = "src/server/api/hono/app.ts";

export type FeatureOptions = { item?: string; content?: boolean; db?: boolean; task?: boolean; by?: string };

const capitalize = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);
const pascal = (words: string[]) => words.map(capitalize).join("");
const camel = (words: string[]) => (words[0] ?? "") + pascal(words.slice(1));

export function singular(name: string): string {
	const words = name.split("-");
	const last = words.pop() ?? name;
	const one = last.endsWith("ies")
		? `${last.slice(0, -3)}y`
		: /(ses|xes|ches|shes)$/.test(last)
			? last.slice(0, -2)
			: last.endsWith("s") && !last.endsWith("ss")
				? last.slice(0, -1)
				: last;
	return [...words, one].join("-");
}

export function featureNames(name: string, item = singular(name)): Record<string, string> {
	const words = name.split("-");
	const itemWords = item.split("-");
	return {
		__name__: name,
		__Name__: pascal(words),
		__camel__: camel(words),
		__snake__: words.join("_"),
		__Title__: capitalize(words.join(" ")),
		__Item__: pascal(itemWords),
		__item__: camel(itemWords),
		// How the RPC client reaches /api/<name>: api.invoices, or api['team-members'] when the name has a dash.
		__apiKey__: name.includes("-") ? `['${name}']` : `.${name}`,
	};
}

const fill = (text: string, names: Record<string, string>) =>
	Object.entries(names).reduce((result, [placeholder, value]) => result.replaceAll(placeholder, value), text);

function listTemplates(dir = templatesDir): string[] {
	if (!existsSync(dir)) return [];
	return readdirSync(dir).flatMap((entry) => {
		const full = join(dir, entry);
		return statSync(full).isDirectory() ? listTemplates(full) : entry.endsWith(".tpl") ? [relative(templatesDir, full)] : [];
	});
}

// Inserts `line` just above the marker comment, so entries stay in order. The `export {}` placeholder of an empty
// tables.ts goes once the first table is exported.
function insertAtMarker(root: string, file: string, marker: string, line: string): string {
	const path = join(root, file);
	const text = existsSync(path) ? readFileSync(path, "utf8") : "";
	const markerLine = text.split("\n").find((candidate) => candidate.includes(marker));
	if (markerLine === undefined) return `add to ${file} by hand: ${line}`;
	const indent = markerLine.match(/^\s*/)?.[0] ?? "";
	writeFileSync(path, text.replace(markerLine, `${indent}${line}\n${markerLine}`).replace(/^export \{\}\n/m, ""));
	return `${file}: ${line.trim()}`;
}

export function scaffoldFeature(root: string, name: string, options: FeatureOptions = {}) {
	if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(name)) {
		throw new Error(`Feature names are kebab-case business nouns, like "invoices" or "team-members" (got "${name}")`);
	}
	const dir = join(root, "src/features", name);
	if (existsSync(dir)) throw new Error(`src/features/${name} already exists`);
	const kit = readKitConfig(root);
	const db = kit.addOns.includes("db") && options.db !== false;
	const content = options.content ?? !db;
	const names = featureNames(name, options.item);

	const created: string[] = [];
	for (const template of listTemplates()) {
		const isContent = template === "content.ts.tpl";
		if (isContent ? !content : !db) continue;
		const dest = fill(template.replace(/\.tpl$/, ""), names);
		mkdirSync(dirname(join(dir, dest)), { recursive: true });
		writeFileSync(join(dir, dest), fill(readFileSync(join(templatesDir, template), "utf8"), names));
		created.push(`src/features/${name}/${dest}`);
	}
	if (!created.length) throw new Error("Nothing to create: add --content, or install the db add-on for data features");

	const wired: string[] = [];
	const has = (file: string) => created.includes(`src/features/${name}/${file}`);
	if (has("server/tables.ts")) {
		wired.push(insertAtMarker(root, tablesFile, "agent-ready:feature-tables", `export * from '#/features/${name}/server/tables'`));
	}
	if (has("server/routes.ts")) {
		wired.push(
			insertAtMarker(root, apiFile, "agent-ready:feature-imports", `import { ${names.__camel__}Routes } from '#/features/${name}/server/routes'`),
			insertAtMarker(root, apiFile, "agent-ready:feature-routes", `.route('/${name}', ${names.__camel__}Routes)`),
		);
	}

	// The project's own Biome settings format and sort what was written, so the result is lint-clean.
	const biome = join(root, "node_modules/.bin/biome");
	const touched = [...created, ...(has("server/tables.ts") ? [tablesFile] : []), ...(has("server/routes.ts") ? [apiFile] : [])];
	if (existsSync(biome)) run(biome, ["check", "--write", "--no-errors-on-unmatched", ...touched], root);

	const scope = [
		`src/features/${name}/**`,
		"{{#tanstack-start}}src/routes/**{{/tanstack-start}}{{#next}}src/app/**{{/next}}",
		...(has("server/tables.ts") ? [tablesFile, "src/server/db/drizzle/migrations/**"] : []),
		...(has("server/routes.ts") ? [apiFile] : []),
	];
	const task = options.task === false ? undefined : createTask(root, `New feature: ${name}`, { by: options.by, scope });
	return { created, wired, task, db };
}

if (isMain(import.meta.url)) {
	const { values, positionals } = parseArgs({
		allowPositionals: true,
		options: {
			item: { type: "string" },
			content: { type: "boolean" },
			"no-db": { type: "boolean" },
			"no-task": { type: "boolean" },
			by: { type: "string" },
		},
	});
	const name = positionals[0];
	if (!name) {
		console.error("Usage: new:feature <name> [--item <singular>] [--content] [--no-db] [--no-task] [--by <agent>]");
		process.exit(1);
	}
	try {
		const result = scaffoldFeature(process.cwd(), name, {
			item: values.item,
			content: values.content,
			db: values["no-db"] ? false : undefined,
			task: values["no-task"] ? false : undefined,
			by: values.by,
		});
		console.log(`created:\n${result.created.map((path) => `  ${path}`).join("\n")}`);
		if (result.wired.length) console.log(`wired:\n${result.wired.map((line) => `  ${line}`).join("\n")}`);
		if (result.task) console.log(`task: ${result.task} (fill Goal and Steps)`);
		console.log("next: replace the example field with the real data, then add pages in {{#tanstack-start}}src/routes/{{/tanstack-start}}{{#next}}src/app/{{/next}} (skill new-feature);");
		console.log("      `{{run}} check` passes once a page uses what was created (Knip flags anything unused)");
		if (result.db) console.log("      {{run}} db:generate → read the SQL → {{run}} db:migrate (ask first) → {{run}} test");
	} catch (error) {
		console.error(`✗ ${(error as Error).message}`);
		process.exit(1);
	}
}
