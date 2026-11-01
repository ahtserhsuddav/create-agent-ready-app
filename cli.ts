#!/usr/bin/env node
// create-agent-ready-app: creates a TanStack Start or Next.js project with the agent setup, or maintains the kit in an
// existing one.
import { existsSync, readFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { parseArgs } from "node:util";
import * as p from "@clack/prompts";
import { applyKit } from "./src/apply-kit";
import {
	applyIds,
	availableIds,
	type ChoiceFlags,
	choicesFromFlags,
	detectPackageManager,
	findMissingRequirements,
	idProblems,
	idsOf,
	kindOf,
	labelOf,
	validateChoices,
} from "./src/create/choices";
import { createProject } from "./src/create/create-project";
import { askChoices, validProjectName } from "./src/create/prompts";
import type { VersionPolicy } from "./src/create/versions";
import { detectChoiceFlags } from "./src/detect";
import { runDoctor } from "./src/doctor";
import { kitVersion, manifest, type ProjectKitConfig, readProjectConfig } from "./src/kit-config";
import { createReport, printReport } from "./src/report";

const { values: flags, positionals } = parseArgs({
	allowPositionals: true,
	options: {
		framework: { type: "string" },
		runtime: { type: "string" },
		pm: { type: "string" },
		"add-ons": { type: "string" },
		preset: { type: "string" },
		skills: { type: "string" },
		design: { type: "string" },
		versions: { type: "string", default: "latest" },
		yes: { type: "boolean", short: "y", default: false },
		quiet: { type: "boolean", default: false },
		"no-install": { type: "boolean", default: false },
		"no-git": { type: "boolean", default: false },
		"no-skills": { type: "boolean", default: false },
		"no-check": { type: "boolean", default: false },
		"dry-run": { type: "boolean", default: false },
		force: { type: "boolean", default: false },
		help: { type: "boolean", short: "h", default: false },
		version: { type: "boolean", short: "v", default: false },
	},
});

const commands = ["create", "install", "update", "add", "remove", "doctor"];
const [first, ...rest] = positionals;
const command = first && commands.includes(first) ? first : "create";
const args = first && commands.includes(first) ? rest : positionals;
const today = () => new Date().toISOString().slice(0, 10);
const choiceFlags: ChoiceFlags = {
	framework: flags.framework,
	runtime: flags.runtime,
	pm: flags.pm,
	addOns: flags["add-ons"],
	preset: flags.preset,
	skills: flags.skills,
	design: flags.design,
};

const group = (label: string) => manifest.addOnGroups.find((entry) => entry.label === label)?.items.join(",") ?? "";
const usage = `create-agent-ready-app ${kitVersion}: a TanStack Start or Next.js app that coding agents are ready to work in
  create-agent-ready-app [dir]                 create a project (asks; --yes uses flags and defaults)
  create-agent-ready-app install [dir]         add the agent setup to an existing project (no app code)
  create-agent-ready-app update  [dir]         refresh the kit's files and skills
  create-agent-ready-app add|remove <id> [dir] an add-on or optional skill pack (ids below)
  create-agent-ready-app doctor  [dir]
Choices:  --framework ${Object.keys(manifest.frameworks).join("|")}  --runtime bun|node  --pm bun|pnpm|npm
  --add-ons ${["UI", "Data", "Forms", "API", "Authentication", "SEO"].map(group).join(",")}
            database ${group("Database")} · email ${group("Email")} · deploy ${group("Deployment")} (pick one each)
  --preset ${Object.keys(manifest.presets).join("|")}   --skills ${group("Agent skills")}   --design <awesome-design-md entry>|none
Other:    --yes --quiet --versions latest|verified --no-install --no-git --no-skills --no-check --dry-run --force`;

function fail(message: string): never {
	console.error(`✗ ${message}`);
	process.exit(1);
}

function existingProject(path: string | undefined): string {
	const root = resolve(path ?? ".");
	if (!existsSync(join(root, "package.json"))) fail(`${root} has no package.json: create a project first`);
	return root;
}

function runApply(root: string, config: ProjectKitConfig, appFiles: boolean) {
	const options = { dryRun: flags["dry-run"], force: flags.force, skills: !flags["no-skills"], appFiles };
	const report = createReport();
	applyKit(root, config, options, report);
	printReport(report, options.dryRun);
}

async function create() {
	if (flags.versions !== "latest" && flags.versions !== "verified") fail("--versions must be latest or verified");
	const detected = detectPackageManager();
	const interactive = !flags.yes && Boolean(process.stdin.isTTY);
	const dirName = args[0] ? basename(resolve(args[0])) : undefined;
	let answers: { name: string; choices: ProjectKitConfig; git: boolean };
	if (interactive) {
		p.intro(`Agent Ready ${kitVersion} · create-agent-ready-app`);
		const asked = await askChoices({ name: dirName, flags: choiceFlags, git: flags["no-git"] ? false : undefined }, detected);
		answers = { ...asked, choices: { ...asked.choices, kitVersion, name: asked.name, createdOn: today() } };
	} else {
		const name = dirName ?? "my-app";
		const choices = choicesFromFlags(choiceFlags, detected);
		const missing = findMissingRequirements(choices);
		if (missing.length) {
			fail(missing.map((need) => `${need.label} needs ${need.needsLabel}: add ${need.needs} or drop ${need.item}`).join("\n"));
		}
		answers = { name, choices: { ...choices, kitVersion, name, createdOn: today() }, git: !flags["no-git"] };
		console.log(`Agent Ready ${kitVersion} · creating ${name}`);
	}
	if (!validProjectName(answers.name)) fail(`"${answers.name}" isn't a valid package name: lowercase letters, numbers, dots, dashes`);
	const ok = await createProject({
		root: resolve(args[0] ?? answers.name),
		config: answers.choices,
		skills: !flags["no-skills"],
		git: answers.git,
		install: !flags["no-install"],
		check: !flags["no-check"],
		quiet: flags.quiet,
		versions: flags.versions as VersionPolicy,
	});
	const outro = ok ? "Done. Happy building!" : "Created, with problems to fix (see above).";
	if (process.stdout.isTTY) p.outro(outro);
	else console.log(outro);
	process.exit(ok ? 0 : 1);
}

if (flags.version) {
	console.log(kitVersion);
	process.exit(0);
}
if (flags.help) {
	console.log(usage);
	process.exit(0);
}

try {
	switch (command) {
		case "create":
			await create();
			break;
		case "install": {
			const root = existingProject(args[0]);
			if (readProjectConfig(root)) fail("The kit is already installed here: use update, add or remove");
			const detected = detectChoiceFlags(root);
			const given = Object.fromEntries(Object.entries(choiceFlags).filter(([, value]) => value !== undefined));
			const merged: ChoiceFlags = { ...detected, ...given };
			const choices = choicesFromFlags(merged, detected.pm as ProjectKitConfig["pm"]);
			const name = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).name ?? basename(root);
			console.log(`Installing Agent Ready ${kitVersion} into ${root} · ${idsOf(choices).map(labelOf).join(", ")}`);
			runApply(root, { ...choices, kitVersion, name, createdOn: today() }, false);
			break;
		}
		case "update": {
			const root = existingProject(args[0]);
			const current = readProjectConfig(root) ?? fail("The kit isn't installed here yet: use install");
			console.log(`Updating ${current.name} from kit ${current.kitVersion} to ${kitVersion}`);
			runApply(root, { ...current, kitVersion }, false);
			break;
		}
		case "add":
		case "remove": {
			const id = args[0];
			const root = existingProject(args[1]);
			const current = readProjectConfig(root) ?? fail("The kit isn't installed here yet: use install");
			const ids = availableIds(current.framework).filter((entry) => kindOf(entry) !== "deploy");
			if (!id || !ids.includes(id)) fail(`Name an add-on or skill pack to ${command}: ${ids.join(", ")}`);
			const nextIds = command === "add" ? [...idsOf(current), id] : idsOf(current).filter((entry) => entry !== id);
			const problems = idProblems(nextIds, current.framework);
			if (problems.length) fail(`${problems.join("\n")}${command === "add" ? ` (remove the other one first)` : ""}`);
			const next: ProjectKitConfig = { ...current, ...applyIds(current, nextIds), kitVersion };
			validateChoices(next);
			const missing = findMissingRequirements(next);
			if (missing.length) fail(missing.map((need) => `${need.label} needs ${need.needsLabel}: add ${need.needs} first`).join("\n"));
			runApply(root, next, command === "add");
			if (kindOf(id) !== "skills") {
				console.log(
					command === "add"
						? "→ Next: add the packages listed above, then wire the add-on in (skill project-setup → Adding an add-on)."
						: `→ The ${labelOf(id)} code and packages are still in the project: deleting them is a Guarded Big task.`,
				);
			}
			break;
		}
		case "doctor":
			process.exit(runDoctor(resolve(args[0] ?? ".")));
	}
} catch (error) {
	fail((error as Error).message);
}
