// Checks a project's kit setup: required files, valid and linked skills, size budgets, and how much context every
// agent session loads before any work starts. Problems fail; budget overruns only warn.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import { kitBlockOf } from "./apply-kit";
import { manifest, readLock, readProjectConfig } from "./kit-config";

const requiredFiles = [
	"AGENTS.md",
	"CLAUDE.md",
	"PROJECT.md",
	"CHANGELOG.md",
	"docs/DEPLOYMENT.md",
	"docs/RUNBOOK.md",
	"design/DESIGN.md",
];
const skillName = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const lineCount = (path: string) => readFileSync(path, "utf8").trimEnd().split("\n").length;
const tokens = (chars: number) => Math.round(chars / 4);

// Agents parse SKILL.md frontmatter as YAML, so check it the same way (an unquoted ": " breaks it).
function readFrontmatter(path: string): Record<string, string> {
	const block = readFileSync(path, "utf8").match(/^---\n([\s\S]*?)\n---/)?.[1];
	try {
		const data = block ? parseYaml(block) : undefined;
		return data && typeof data === "object" ? (data as Record<string, string>) : {};
	} catch {
		return { invalid: "yes" };
	}
}

export function runDoctor(root: string): number {
	const problems: string[] = [];
	const warnings: string[] = [];
	const config = readProjectConfig(root);
	if (!config) {
		console.log(`✗ No .agents/kit.json in ${root}: run \`npx create-agent-ready-app install ${root}\` first.`);
		return 1;
	}
	const lock = readLock(root);
	console.log(`agent-ready doctor · ${config.name} (${config.framework} · ${config.runtime}/${config.pm} · ${config.deploy} · ${config.addOns.join(", ") || "no add-ons"})`);

	for (const path of requiredFiles) if (!existsSync(join(root, path))) problems.push(`missing ${path}`);
	const agentsText = existsSync(join(root, "AGENTS.md")) ? readFileSync(join(root, "AGENTS.md"), "utf8") : "";
	const kitBlock = kitBlockOf(agentsText);
	if (agentsText && kitBlock === undefined) problems.push("AGENTS.md has no agent-ready block (run update)");
	for (const [name, repo] of Object.entries(lock.skills)) {
		if (!existsSync(join(root, ".agents/skills", name, "SKILL.md"))) warnings.push(`community skill ${name} (${repo}) is missing: run update`);
	}

	const skillsDir = join(root, ".agents/skills");
	const skills = existsSync(skillsDir) ? readdirSync(skillsDir).filter((name) => statSync(join(skillsDir, name)).isDirectory()) : [];
	let descriptionChars = 0;
	for (const name of skills) {
		const skillFile = join(skillsDir, name, "SKILL.md");
		if (!existsSync(skillFile)) {
			problems.push(`.agents/skills/${name} has no SKILL.md`);
			continue;
		}
		// The kit's own skills must be valid; a community skill's quirks are its maintainer's, so they only warn.
		const isKitSkill = `.agents/skills/${name}/SKILL.md` in lock.files;
		const issues: string[] = [];
		const front = readFrontmatter(skillFile);
		if (front.invalid) issues.push(`skill ${name}: frontmatter is not valid YAML (quote values that contain ": ")`);
		else if (front.name !== name) issues.push(`skill ${name}: frontmatter name is "${front.name ?? ""}"`);
		if (!skillName.test(name) || name.length > 64) issues.push(`skill ${name}: name must be kebab-case, ≤ 64 characters`);
		const description = typeof front.description === "string" ? front.description : "";
		if (!description || description.length > 1024) issues.push(`skill ${name}: description must be 1–1024 characters`);
		descriptionChars += name.length + description.length;
		if (!existsSync(join(root, ".claude/skills", name, "SKILL.md"))) issues.push(`skill ${name} is not linked in .claude/skills`);
		(isKitSkill ? problems : warnings).push(...issues);
		if (isKitSkill && lineCount(skillFile) > (manifest.budgets.kitSkill ?? 120)) {
			warnings.push(`skill ${name}: ${lineCount(skillFile)} lines (budget ${manifest.budgets.kitSkill})`);
		}
	}

	for (const [path, budget] of Object.entries(manifest.budgets)) {
		const full = join(root, path);
		if (!path.includes(".") || !existsSync(full)) continue;
		// AGENTS.md is shared with Next.js and TanStack Intent: only the kit's block counts against the kit's budget.
		const lines = path === "AGENTS.md" && kitBlock !== undefined ? kitBlock.split("\n").length : lineCount(full);
		if (lines > budget) warnings.push(`${path}${path === "AGENTS.md" ? " (kit block)" : ""}: ${lines} lines (budget ${budget})`);
	}
	const tasksDir = join(root, "tasks");
	for (const task of existsSync(tasksDir) ? readdirSync(tasksDir).filter((file) => file.endsWith(".md")) : []) {
		const lines = lineCount(join(tasksDir, task));
		if (lines > (manifest.budgets.taskFile ?? 15)) warnings.push(`tasks/${task}: ${lines} lines (budget ${manifest.budgets.taskFile})`);
	}

	const agentsChars = agentsText.length;
	const claudeChars = existsSync(join(root, "CLAUDE.md")) ? readFileSync(join(root, "CLAUDE.md"), "utf8").length : 0;

	const community = Object.keys(lock.skills).length;
	if (!problems.length) {
		console.log(`✓ ${skills.length - community} kit skills and ${community} community skills linked for Claude Code; required files present`);
	}
	for (const problem of problems) console.log(`✗ ${problem}`);
	for (const warning of warnings) console.log(`⚠ ${warning}`);
	console.log(
		`Startup context ≈ ${tokens(agentsChars + claudeChars + descriptionChars).toLocaleString()} tokens ` +
			`(AGENTS.md ${tokens(agentsChars)} · CLAUDE.md ${tokens(claudeChars)} · ${skills.length} skill descriptions ${tokens(descriptionChars)})`,
	);
	return problems.length ? 1 : 0;
}
