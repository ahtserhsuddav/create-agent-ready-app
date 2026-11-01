#!/usr/bin/env bun
// Proves the templates still work with today's packages: creates one project per combination below with the built
// CLI (at the newest versions; create runs check and build itself), runs doctor, then starts the production build and
// requests a few pages. Failed projects are kept for debugging; passing ones are deleted.
// Usage: bun run build && bun run verify:build [--only <name>] [--quick]   (--quick: the first two combinations)
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseArgs } from "node:util";

type Combo = { name: string; args: string[]; start: string[]; paths: string[]; skills?: boolean };

// The first two (one per framework) are --quick. The first also installs the community skills, so that path is tested.
const app = "seo,shadcn,query,form,hono,auth";
const combos: Combo[] = [
	{
		name: "static-tanstack-bun-cloudflare",
		args: ["--framework", "tanstack-start", "--runtime", "bun", "--add-ons", "seo,shadcn,cloudflare"],
		start: ["bun", "run", "preview"],
		paths: ["/", "/robots.txt", "/sitemap.xml", "/llms.txt"],
		skills: true,
	},
	{
		name: "app-next-bun-vercel",
		args: ["--framework", "next", "--runtime", "bun", "--add-ons", `${app},postgres,resend,vercel`, "--skills", "next-workflows"],
		start: ["bun", "run", "start"],
		paths: ["/", "/api/health", "/robots.txt", "/sign-in"],
	},
	{
		name: "app-tanstack-pnpm-node",
		args: ["--framework", "tanstack-start", "--runtime", "node", "--pm", "pnpm", "--add-ons", `${app},postgres,zeptomail,node`],
		start: ["pnpm", "run", "start"],
		paths: ["/", "/api/health"],
	},
	{
		name: "app-tanstack-bun-cloudflare",
		args: ["--framework", "tanstack-start", "--runtime", "bun", "--add-ons", `${app},postgres,resend,cloudflare`],
		start: ["bun", "run", "preview"],
		paths: ["/", "/api/health"],
	},
	{
		name: "d1-tanstack-bun-cloudflare",
		args: ["--framework", "tanstack-start", "--runtime", "bun", "--add-ons", "d1,auth,cloudflare"],
		start: ["bun", "run", "preview"],
		paths: ["/"],
	},
	{
		name: "app-next-npm-cloudflare",
		args: ["--framework", "next", "--runtime", "node", "--pm", "npm", "--add-ons", `${app},postgres,cloudflare`],
		start: ["npm", "run", "preview"],
		paths: ["/", "/api/health"],
	},
	{
		name: "bare-next-pnpm-node",
		args: ["--framework", "next", "--runtime", "node", "--pm", "pnpm", "--add-ons", "none"],
		start: ["pnpm", "run", "start"],
		paths: ["/"],
	},
];

const { values } = parseArgs({ options: { only: { type: "string" }, quick: { type: "boolean", default: false } } });
const cli = join(import.meta.dirname, "..", "dist", "cli.js");
const selected = combos.filter((combo) => !values.only || combo.name === values.only).slice(0, values.quick ? 2 : undefined);
const results: { name: string; ok: boolean; step: string; dir: string }[] = [];

async function smoke(dir: string, combo: Combo): Promise<string | undefined> {
	const port = String(4100 + results.length);
	// `bun run x --port n` forwards the flag; npm and pnpm need `--` first.
	const portArgs = combo.start.includes("preview") ? [...(combo.start[0] === "bun" ? [] : ["--"]), "--port", port] : [];
	const server = spawn(combo.start[0] ?? "npm", [...combo.start.slice(1), ...portArgs], {
		cwd: dir,
		// Placeholder settings, so pages that read the session render (no real database or email is reached).
		env: {
			...process.env,
			PORT: port,
			DATABASE_URL: "postgres://app:app@localhost:5432/app",
			BETTER_AUTH_SECRET: "verify-build-secret-0123456789abcdef",
			BETTER_AUTH_URL: `http://localhost:${port}`,
			EMAIL_FROM: "verify@example.com",
			EMAIL_FROM_NAME: "verify-build",
		},
		stdio: "ignore",
	});
	try {
		for (let attempt = 0; attempt < 60; attempt++) {
			const ready = await fetch(`http://localhost:${port}/`, { signal: AbortSignal.timeout(10_000) }).then(
				(response) => response.status < 500,
				() => false,
			);
			if (ready) break;
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
		for (const path of combo.paths) {
			// A page that hangs fails instead of blocking the run.
			const response = await fetch(`http://localhost:${port}${path}`, { signal: AbortSignal.timeout(20_000) }).catch(() => undefined);
			if (response?.status !== 200) return `GET ${path} → ${response?.status ?? "no answer"}`;
		}
		return undefined;
	} finally {
		server.kill();
	}
}

for (const combo of selected) {
	const parent = mkdtempSync(join(tmpdir(), `verify-${combo.name}-`));
	const dir = join(parent, combo.name);
	console.log(`▶ ${combo.name}`);
	const created = spawnSync("node", [cli, dir, "--yes", ...(combo.skills ? [] : ["--no-skills"]), ...combo.args], { encoding: "utf8" });
	if (created.status !== 0) {
		results.push({ name: combo.name, ok: false, step: `create: ${(created.stdout + created.stderr).split("\n").slice(-12).join("\n")}`, dir });
		continue;
	}
	const doctor = spawnSync("node", [cli, "doctor", dir], { encoding: "utf8" });
	if (doctor.status !== 0) {
		results.push({ name: combo.name, ok: false, step: `doctor: ${doctor.stdout}`, dir });
		continue;
	}
	const problem = await smoke(dir, combo);
	results.push({ name: combo.name, ok: !problem, step: problem ?? "create, check, build, doctor, smoke", dir });
	if (!problem) rmSync(parent, { recursive: true, force: true });
}

for (const result of results) console.log(`${result.ok ? "✓" : "✗"} ${result.name}: ${result.ok ? result.step : `${result.step}\n  kept at ${result.dir}`}`);
process.exit(results.every((result) => result.ok) ? 0 : 1);
