#!/usr/bin/env node
// Runs on `{{install}}` (prepare): links every skill in .agents/skills/ into .claude/skills/ for Claude Code (copies
// on Windows), removes links to skills that are gone, and turns on the git hooks in .githooks/. Never fails install.
import { cpSync, existsSync, lstatSync, mkdirSync, readdirSync, rmSync, symlinkSync } from "node:fs";
import { join } from "node:path";
import { git, isMain } from "./project-info.ts";

export function linkSkills(root: string) {
	const source = join(root, ".agents/skills");
	const target = join(root, ".claude/skills");
	const linked: string[] = [];
	const removed: string[] = [];
	if (!existsSync(source)) return { linked, removed };
	mkdirSync(target, { recursive: true });
	for (const name of readdirSync(source)) {
		const link = join(target, name);
		if (existsSync(join(source, name, "SKILL.md")) === false || existsSync(join(link, "SKILL.md"))) continue;
		rmSync(link, { recursive: true, force: true });
		if (process.platform === "win32") cpSync(join(source, name), link, { recursive: true });
		else symlinkSync(join("..", "..", ".agents", "skills", name), link, "dir");
		linked.push(name);
	}
	for (const name of readdirSync(target)) {
		const link = join(target, name);
		if (lstatSync(link).isSymbolicLink() && !existsSync(link)) {
			rmSync(link, { force: true });
			removed.push(name);
		}
	}
	return { linked, removed };
}

export function enableGitHooks(root: string): boolean {
	if (!existsSync(join(root, ".githooks")) || git(root, ["rev-parse", "--git-dir"]) === undefined) return false;
	return git(root, ["config", "core.hooksPath", ".githooks"]) !== undefined;
}

if (isMain(import.meta.url)) {
	try {
		const root = process.cwd();
		const { linked, removed } = linkSkills(root);
		enableGitHooks(root);
		if (linked.length || removed.length) {
			console.log(`skills: linked ${linked.length} for Claude Code${removed.length ? `, removed ${removed.length} stale links` : ""}`);
		}
	} catch (error) {
		console.error(`skill links skipped: ${(error as Error).message}`);
	}
}
