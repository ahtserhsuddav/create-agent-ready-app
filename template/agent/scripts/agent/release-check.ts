#!/usr/bin/env node
// The production gate: all checks, a production build, end-to-end tests (when a test:e2e script exists) and a
// dependency audit. Stops at the first failure. Used by the release skill and CI; never after small changes.
// Usage: {{run}} release:check
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const scripts: Record<string, string> = JSON.parse(readFileSync("package.json", "utf8")).scripts ?? {};
const steps: [label: string, command: string][] = [
	["checks", "{{run}} check"],
	["build", "{{run}} build"],
	...(scripts["test:e2e"] ? ([["end-to-end tests", "{{run}} test:e2e"]] as [string, string][]) : []),
	["dependency audit", "{{audit}} --audit-level=high"],
];

for (const [label, command] of steps) {
	console.log(`▶ ${label}: ${command}`);
	if (spawnSync(command, { stdio: "inherit", shell: true }).status !== 0) {
		console.error(`✗ ${label} failed: fix it before releasing`);
		process.exit(1);
	}
}
console.log("✓ release checks passed");
