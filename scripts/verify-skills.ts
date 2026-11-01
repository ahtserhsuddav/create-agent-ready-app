#!/usr/bin/env bun
// Checks that every community skill the manifest installs still exists upstream: lists each source repository with
// the skills CLI (`skills add <repo> --list`) and fails when a declared skill was renamed or removed. Runs in the weekly
// canary and before each release, so a project never asks for a skill its maker took away.
// Usage: bun run verify:skills [--only <owner/repo>]
import { spawnSync } from "node:child_process";
import { parseArgs } from "node:util";
import { manifest } from "../src/kit-config";
import { stripAnsi } from "../src/run";

const { values } = parseArgs({ options: { only: { type: "string" } } });
const wanted = new Map<string, Set<string>>();
for (const pack of Object.values(manifest.skillPacks)) {
	for (const source of pack.sources) {
		const names = wanted.get(source.repo) ?? new Set<string>();
		for (const name of source.skills) names.add(name);
		wanted.set(source.repo, names);
	}
}

const problems: string[] = [];
for (const [repo, names] of wanted) {
	if (values.only && repo !== values.only) continue;
	const result = spawnSync("npx", ["-y", "skills@latest", "add", repo, "--list"], {
		encoding: "utf8",
		env: { ...process.env, DISABLE_TELEMETRY: "1", DO_NOT_TRACK: "1" },
	});
	const out = stripAnsi(`${result.stdout ?? ""}${result.stderr ?? ""}`).replace(/\r/g, "\n");
	const found = new Set([...out.matchAll(/^│ {4}([a-z0-9][a-z0-9.-]+)\s*$/gm)].map((match) => match[1]));
	const missing = [...names].filter((name) => !found.has(name));
	console.log(`${missing.length ? "✗" : "✓"} ${repo}: ${names.size} used, ${found.size} available${missing.length ? `, missing ${missing.join(", ")}` : ""}`);
	if (missing.length) problems.push(`${repo}: ${missing.join(", ")}`);
}
if (problems.length) console.log(`\nRenamed or removed upstream (update manifest.json → skillPacks):\n  ${problems.join("\n  ")}`);
process.exit(problems.length ? 1 : 0);
