// Community skills, installed from their upstream repos with the open `skills` CLI: copies in .agents/skills/ (where
// Codex, Cursor, Copilot, Gemini and others look), links in .claude/skills/ for Claude Code, and a record in
// skills-lock.json. Every project gets that day's version; `<run> skills:update` refreshes them later.
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { activeSkillPacks, type Choices, type SkillSource } from "./kit-config";
import { dlxArgs, type PackageManager } from "./package-manager";
import type { Report } from "./report";
import { lastLine, run, runStreaming } from "./run";

export const hasSkill = (root: string, name: string) => existsSync(join(root, ".agents/skills", name, "SKILL.md"));

// The active packs' sources merged by repo, so each repo is fetched once.
export function plannedSources(config: Choices): SkillSource[] {
	const byRepo = new Map<string, string[]>();
	for (const [, pack] of activeSkillPacks(config)) {
		for (const source of pack.sources) {
			const names = byRepo.get(source.repo) ?? [];
			for (const name of source.skills) if (!names.includes(name)) names.push(name);
			byRepo.set(source.repo, names);
		}
	}
	return [...byRepo].map(([repo, skills]) => ({ repo, skills }));
}

const addCommand = (pm: PackageManager, repo: string, skills: string[]) =>
	dlxArgs(pm, "skills@latest", ["add", repo, "--skill", ...skills, "--agent", "universal", "--agent", "claude-code", "--yes"]);

export type SkillsResult = { installed: Record<string, string>; missing: string[]; failures: string[] };

// create: installs each source's missing skills, streaming the CLI's output; `done` is called once per source.
export async function installSkills(
	root: string,
	pm: PackageManager,
	sources: SkillSource[],
	done: (repo: string) => void,
	onLine: (line: string) => void = () => {},
): Promise<SkillsResult> {
	const result: SkillsResult = { installed: {}, missing: [], failures: [] };
	for (const source of sources) {
		const missing = source.skills.filter((name) => !hasSkill(root, name));
		if (missing.length) {
			const [command = "npx", ...args] = addCommand(pm, source.repo, missing);
			const outcome = await runStreaming(command, args, root, onLine);
			if (outcome.code !== 0) result.failures.push(`${source.repo}: ${lastLine(outcome.out)}`);
		}
		for (const name of source.skills) {
			if (hasSkill(root, name)) result.installed[name] = source.repo;
			else result.missing.push(`${name} (${source.repo})`);
		}
		done(source.repo);
	}
	return result;
}

// install, update, add, remove: installs what's missing and removes the skills of packs that no longer apply.
// `previous` is the lock's record of what the kit installed before; skills the project added itself are never touched.
export function syncSkills(
	root: string,
	config: Choices,
	previous: Record<string, string>,
	report: Report,
	install: boolean,
): Record<string, string> {
	const installed: Record<string, string> = {};
	const sources = plannedSources(config);
	for (const source of sources) {
		const missing = source.skills.filter((name) => !hasSkill(root, name));
		if (missing.length && install) {
			const [command = "npx", ...args] = addCommand(config.pm, source.repo, missing);
			const result = run(command, args, root);
			const stillMissing = missing.filter((name) => !hasSkill(root, name));
			if (result.code !== 0 || stillMissing.length) {
				report.notes.push(`Skills ${stillMissing.join(", ")} from ${source.repo} not installed: ${lastLine(result.out)}`);
			}
			for (const name of missing.filter((skill) => hasSkill(root, skill))) report.created.push(`.agents/skills/${name} (${source.repo})`);
		} else if (missing.length) {
			report.notes.push(`Skills skipped (--no-skills): ${missing.join(", ")} from ${source.repo}`);
		}
		for (const name of source.skills.filter((skill) => hasSkill(root, skill))) installed[name] = source.repo;
	}
	const wanted = new Set(sources.flatMap((source) => source.skills));
	const stale = Object.entries(previous).filter(([name]) => !wanted.has(name));
	if (stale.length) {
		const [command = "npx", ...args] = dlxArgs(config.pm, "skills@latest", ["remove", ...stale.map(([name]) => name), "--yes"]);
		run(command, args, root);
		for (const [name, repo] of stale) {
			rmSync(join(root, ".agents/skills", name), { recursive: true, force: true });
			rmSync(join(root, ".claude/skills", name), { recursive: true, force: true });
			report.removed.push(`.agents/skills/${name} (${repo})`);
		}
	}
	return installed;
}
