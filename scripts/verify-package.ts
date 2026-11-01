#!/usr/bin/env bun
// Checks the package the way npm users get it: packs the tarball and compares it with template/ (npm silently drops
// some file names, such as .npmrc), installs it into an empty folder, then runs the installed bin: --version, --help,
// and `install --dry-run` into a stub project, which reads every template from node_modules.
// Usage: bun run build && bun run verify:package
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";

const root = join(import.meta.dirname, "..");
const { name, version } = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const work = mkdtempSync(join(tmpdir(), "verify-package-"));
const problems: string[] = [];
let summary = "";

function run(command: string, args: string[], cwd: string): string {
	const result = spawnSync(command, args, { cwd, encoding: "utf8" });
	if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed:\n${result.stdout}${result.stderr}`);
	return result.stdout;
}

function filesBelow(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		if (entry.name === ".DS_Store") return [];
		const path = join(dir, entry.name);
		return entry.isDirectory() ? filesBelow(path) : [relative(root, path)];
	});
}

try {
	// npm 11 prints an array, npm 12 an object keyed by package name.
	const output = JSON.parse(run("npm", ["pack", "--json", "--pack-destination", work], root));
	const packed = Array.isArray(output) ? output[0] : output[name];
	const files = new Set<string>(packed.files.map((file: { path: string }) => file.path));
	const expected = ["package.json", "README.md", "LICENSE", "manifest.json", "dist/cli.js", ...filesBelow(join(root, "template"))];
	const missing = expected.filter((path) => !files.has(path));
	if (missing.length) problems.push(`not in the package (npm drops some file names: generate those from manifest.json):\n  ${missing.join("\n  ")}`);
	const unexpected = [...files].filter((path) => !/^(package\.json|README\.md|LICENSE|manifest\.json|dist\/cli\.js|template\/)/.test(path));
	if (unexpected.length) problems.push(`unexpected files in the package:\n  ${unexpected.join("\n  ")}`);
	summary = `${files.size} files, ${Math.round(packed.size / 1024)} KB packed`;

	// Installed the way `npm create` gets it. dist/cli.js bundles its dependencies, so nothing else is installed.
	const app = join(work, "app");
	mkdirSync(app);
	writeFileSync(join(app, "package.json"), "{}\n");
	run("npm", ["install", "--no-audit", "--no-fund", join(work, packed.filename)], app);
	const bin = join(app, "node_modules", ".bin", name);
	const shown = run(bin, ["--version"], app).trim();
	if (shown !== version) problems.push(`--version printed "${shown}", package.json says ${version}`);
	run(bin, ["--help"], app);
	const installed = readdirSync(join(app, "node_modules")).filter((dir) => !dir.startsWith("."));
	if (installed.join() !== name) problems.push(`installing it also installed: ${installed.filter((dir) => dir !== name).join(", ")}`);

	const project = join(work, "project");
	mkdirSync(project);
	writeFileSync(join(project, "package.json"), JSON.stringify({ name: "stub", dependencies: { "@tanstack/react-start": "^1" } }));
	const plan = run(bin, ["install", project, "--dry-run", "--no-skills"], app);
	if (!plan.includes("AGENTS.md")) problems.push(`install --dry-run didn't plan AGENTS.md:\n${plan}`);
} catch (error) {
	problems.push((error as Error).message);
} finally {
	rmSync(work, { recursive: true, force: true });
}

console.log(problems.length ? `✗ ${name}@${version}\n${problems.join("\n")}` : `✓ ${name}@${version}: ${summary}; installs with no dependencies and runs`);
process.exit(problems.length ? 1 : 0);
