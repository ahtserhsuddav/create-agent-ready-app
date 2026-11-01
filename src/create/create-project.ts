// `create`: the official scaffold, the kit's files for the chosen add-ons, the newest packages (installed with the
// package manager's own live output), the official generators, the community skills, git, and one check that the
// result builds. Nothing outside the new folder is touched.
import { existsSync, readdirSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import * as p from "@clack/prompts";
import { applyKit } from "../apply-kit";
import { designFileText, fetchDesign } from "../design-md";
import { lockPath, manifest, type ProjectKitConfig, readLock, renderFlags, writeJson } from "../kit-config";
import { packageManagers } from "../package-manager";
import { createReport } from "../report";
import { lastLine, run, runAttached, runStreaming } from "../run";
import { installSkills, plannedSources } from "../skills";
import { Progress } from "../ui/progress";
import { runOfficialClis } from "./official-clis";
import { allowPnpmBuilds, patchPackageJson, patchTsconfig, patchWrangler, pinCompatibilityDate, scaffoldBase } from "./scaffold-base";
import { type FetchPackument, type ResolvedPackage, setPackageVersions, type VersionPolicy } from "./versions";

export type CreateOptions = {
	root: string;
	config: ProjectKitConfig;
	skills: boolean;
	git: boolean;
	install: boolean;
	check: boolean;
	quiet: boolean;
	versions: VersionPolicy;
	fetcher?: FetchPackument;
};

export async function createProject(options: CreateOptions): Promise<boolean> {
	const { root, config } = options;
	const flags = renderFlags(config);
	const pm = packageManagers[config.pm];
	if (existsSync(root) && readdirSync(root).length) throw new Error(`${root} is not empty: pick a new folder`);
	checkTools(options);

	const total = 2 + (options.install ? 3 : 0) + (options.skills ? 1 : 0) + (options.git ? 1 : 0) + (options.install && options.check ? 1 : 0);
	const ui = new Progress(total);
	const problems: string[] = [];
	const fail = (what: string) => problems.push(what);

	const frameworkLabel = manifest.frameworks[config.framework]?.label ?? config.framework;
	const scaffold = await ui.stream(`${frameworkLabel} base (official scaffolder, latest)`, async (line) => {
		try {
			await scaffoldBase(root, config, line);
			if (config.framework === "tanstack-start") patchTsconfig(root);
			patchPackageJson(root, config);
			allowPnpmBuilds(root, config);
			return { ok: true };
		} catch (error) {
			return { ok: false, detail: (error as Error).message.split("\n")[0] };
		}
	});
	if (!scaffold.ok) throw new Error(`The ${frameworkLabel} scaffolder failed: nothing else was done.`);

	const report = createReport();
	await ui.spin(
		"Kit files for your add-ons",
		async () => {
			applyKit(root, config, { dryRun: false, force: false, skills: false, create: true }, report);
			// After the kit's files: Next.js gets its wrangler.jsonc from the kit, TanStack Start from its scaffolder.
			patchWrangler(root, config);
			if (config.design) await copyDesign(root, config.design, ui);
		},
		() => `Kit files: ${report.created.length} written${config.design ? `, design/DESIGN.md from ${config.design}` : ""}`,
	);
	for (const note of report.notes) ui.warn(note);

	if (options.install) {
		const versions = await ui.spin(
			"Newest package versions",
			() => setPackageVersions(root, flags, options.versions, options.fetcher),
			(resolved) => `${resolved.length} packages at their newest versions`,
		);
		reportVersions(versions, ui);
		const [command = "npm", ...args] = pm.install.split(" ");
		const installed = options.quiet
			? await ui.stream(`Installing ${versions.length} packages with ${config.pm}`, async (line) => {
					const result = await runStreaming(command, args, root, line);
					return { ok: result.code === 0, detail: result.code === 0 ? undefined : lastLine(result.out) };
				})
			: await ui.attached(
					`Installing ${versions.length} packages with ${config.pm}`,
					packageList(versions),
					() => runAttached(command, args, root),
					`${versions.length} packages installed`,
				);
		if (!installed.ok) {
			fail(`${pm.install} failed`);
		} else {
			pinCompatibilityDate(root);
			const tools: string[] = [];
			const generated = await ui.stream("Official generators", async (line) => {
				const steps = await runOfficialClis(root, config, flags, line);
				tools.push(...steps.filter((step) => !step.ok).map((step) => `${step.label}: ${step.detail}`));
				return { ok: tools.length === 0, detail: tools.join("; ") };
			});
			if (!generated.ok) fail(`generators: ${tools.join("; ")}`);
		}
	}

	if (options.skills) {
		const sources = plannedSources(config);
		const result = await ui.bar(
			"Agent skills",
			sources.length,
			(advance) =>
				installSkills(root, config.pm, sources, (repo) => advance(repo)),
			(outcome) => `${Object.keys(outcome.installed).length} agent skills from ${sources.length} sources`,
		);
		for (const failure of result.failures) ui.warn(`Skills from ${failure}`);
		if (result.missing.length) ui.warn(`Not installed (\`${pm.run} skills:update\` retries): ${result.missing.join(", ")}`);
		const lock = readLock(root);
		writeJson(lockPath(root), { ...lock, skills: result.installed });
		const linked = run(config.runtime === "bun" ? "bun" : "node", ["scripts/agent/link-skills-and-hooks.ts"], root);
		if (linked.code !== 0) ui.warn(`Skill links: ${lastLine(linked.out)}`);
	}

	if (options.git) await ui.spin("git init and first commit", () => initGit(root, ui), () => "git repository with a first commit");

	let healthy = true;
	if (options.install && options.check) {
		const [command = "npm", ...args] = pm.run.split(" ");
		const scriptStep = (name: string) => ({
			name: `${pm.run} ${name}`,
			run: async () => {
				const result = await runStreaming(command, [...args, name], root, () => {});
				return { ok: result.code === 0, out: result.out };
			},
		});
		healthy = await ui.checks("Checking the new project", ["typecheck", "lint", "unused", "test", "build"].map(scriptStep));
		if (!healthy) fail("the final check");
	}

	const ok = healthy && problems.length === 0;
	if (!ok && existsSync(root)) {
		const logFile = join(root, ".agents/create.log");
		ui.saveLog(logFile);
		ui.warn(`Everything that ran is in ${relative(process.cwd(), logFile)}`);
	}
	if (ui.live) p.note(nextSteps(options, ok).join("\n"), "Next steps");
	else console.log(`\nNext steps:\n${nextSteps(options, ok).map((line) => `  ${line}`).join("\n")}`);
	return ok;
}

function checkTools(options: CreateOptions) {
	const { config } = options;
	const need = [config.pm, ...(config.runtime === "bun" ? ["bun"] : ["node"]), ...(options.git ? ["git"] : [])];
	for (const tool of new Set(need)) {
		if (run(tool, ["--version"], process.cwd()).code !== 0) throw new Error(`${tool} is not installed (or not on PATH)`);
	}
	const [major = 0, minor = 0] = run("node", ["--version"], process.cwd()).out.replace(/^v/, "").split(".").map(Number);
	if (major < 22 || (major === 22 && minor < 20)) {
		throw new Error("Node.js 22.20 or newer is needed (the skills CLI and the agent scripts' .ts files need it)");
	}
}

// The packages the install adds, with the versions just resolved, before the package manager takes over.
function packageList(versions: ResolvedPackage[]): string[] {
	const line = (dev: boolean) =>
		versions
			.filter((item) => item.dev === dev)
			.sort((a, b) => a.name.localeCompare(b.name))
			.map((item) => `${item.name} ${item.version}`)
			.join(" · ");
	return [`dependencies  ${line(false)}`, `dev           ${line(true)}`];
}

function reportVersions(versions: ResolvedPackage[], ui: Progress) {
	for (const item of versions.filter((entry) => entry.heldBack)) ui.info(`${item.name} ${item.version}: held back (${item.heldBack})`);
	const newer = versions.filter((entry) => entry.newerThanVerified);
	if (newer.length) {
		ui.warn(
			`Newer than the versions these templates were checked with (${manifest.verifiedOn}): ${newer.map((entry) => `${entry.name} ${entry.version}`).join(", ")}. ` +
				"If the final check fails, run create again with --versions verified, and read each package's migration guide.",
		);
	}
}

async function copyDesign(root: string, name: string, ui: Progress) {
	try {
		writeFileSync(join(root, "design/DESIGN.md"), designFileText(name, await fetchDesign(name)));
	} catch (error) {
		ui.warn(`design/DESIGN.md kept as the kit's template: ${(error as Error).message}`);
	}
}

function initGit(root: string, ui: Progress) {
	run("git", ["init", "-q"], root);
	run("git", ["add", "-A"], root);
	const commit = run("git", ["commit", "-q", "-m", "Initial commit from create-agent-ready-app"], root);
	if (commit.code !== 0) ui.warn(`git commit skipped (${lastLine(commit.out)}): set git user.name and user.email, then commit.`);
}

function nextSteps(options: CreateOptions, healthy: boolean): string[] {
	const { config } = options;
	const pm = packageManagers[config.pm];
	const has = (addOn: string) => config.addOns.includes(addOn);
	const steps = [`cd ${relative(process.cwd(), options.root) || "."}`];
	if (!options.install) steps.push(pm.install);
	if (has("db") || has("auth") || has("email")) steps.push("cp .env.example .env   # then fill it in");
	if (config.db === "postgres") steps.push("docker compose up -d   # local Postgres");
	if (has("db") && config.db) steps.push(`${pm.run} db:migrate`);
	steps.push(`${pm.run} dev   # http://localhost:3000`);
	steps.push("", "Ask your coding agent: “Read AGENTS.md, then finish the project setup (skill project-setup).”");
	steps.push(`Agent skills stay current with \`${pm.run} skills:update\` (and a weekly pull request in CI).`);
	if (!healthy) steps.push("", "Some steps failed (see above). The project is there; fix those first, or report them to the kit.");
	return steps;
}
