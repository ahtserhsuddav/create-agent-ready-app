import { afterAll, describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { existsSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { blockStart } from "../../src/apply-kit";
import { apply, configFor, makeProject, read, scripts } from "./helpers";

const projects: string[] = [];
afterAll(() => {
	for (const root of projects) rmSync(root, { recursive: true, force: true });
});
const project = (options?: { legacyAgentFiles?: boolean }) => {
	const root = makeProject(options);
	projects.push(root);
	return root;
};

describe("create: overlay a scaffold", () => {
	const root = project();
	const config = configFor({ addOns: ["seo", "shadcn", "query", "form", "hono", "db", "auth"], db: "postgres" });
	apply(root, config, "create");

	test("replaces the scaffold's own router and root route", () => {
		expect(read(root, "src/router.tsx")).toContain("setupRouterSsrQueryIntegration");
		expect(read(root, "src/routes/__root.tsx")).toContain("createRootRouteWithContext");
	});

	test("writes the app in category/vendor/role folders", () => {
		for (const path of [
			"src/server/api/hono/app.ts",
			"src/server/auth/better-auth/setup.ts",
			"src/server/db/drizzle/client.ts",
			"src/shared/api/hono/client.ts",
			"src/shared/auth/better-auth/client.ts",
			"src/features/auth/components/sign-in-card.tsx",
		]) {
			expect(existsSync(join(root, path))).toBe(true);
		}
		expect(read(root, "src/server/auth/better-auth/setup.ts")).toContain("tanstackStartCookies(), // must stay last");
	});

	test("package.json gets the kit's scripts in the project's package manager, minus the scaffold's duplicates", () => {
		expect(scripts(root).check).toBe("bun run typecheck && bun run lint && bun run unused && bun run test && bun run scope");
		expect(scripts(root)["auth:generate"]).toContain("--dialect postgresql");
		expect(scripts(root)["generate-routes"]).toBeUndefined();
		expect(read(root, ".claude/settings.json")).toContain("Bash(bun run dev)");
	});

	test("links the skills for Claude Code and turns on the git hooks", () => {
		expect(existsSync(join(root, ".claude/skills/project-structure/SKILL.md"))).toBe(true);
		const hooks = spawnSync("git", ["config", "core.hooksPath"], { cwd: root, encoding: "utf8" }).stdout.trim();
		expect(hooks).toBe(".githooks");
	});
});

describe("create for Node with pnpm", () => {
	test("every command uses pnpm and the scripts run on Node", () => {
		const root = project();
		apply(root, configFor({ runtime: "node", pm: "pnpm", deploy: "node", addOns: ["db"], db: "postgres" }), "create");
		expect(scripts(root).log).toBe("node scripts/agent/log.ts");
		expect(scripts(root).test).toBe("vitest run");
		expect(scripts(root).start).toBe("node .output/server/index.mjs");
		expect(read(root, "AGENTS.md")).toContain("`pnpm run dev`");
		expect(read(root, "AGENTS.md")).not.toContain("bun run");
		expect(read(root, ".github/workflows/ci.yml")).toContain("pnpm/action-setup");
		expect(read(root, "drizzle.config.ts")).toContain("process.loadEnvFile");
	});
});

describe("install into an existing project", () => {
	const root = project({ legacyAgentFiles: true });
	apply(root, configFor({ addOns: ["seo", "hono"] }), "install");

	test("adds the agent setup but no app code", () => {
		expect(read(root, "AGENTS.md")).toContain(blockStart);
		expect(existsSync(join(root, "src/server"))).toBe(false);
		expect(read(root, "src/router.tsx")).toBe("// the scaffold's router\n");
		expect(JSON.parse(read(root, "biome.json")).extends).toEqual(["./.agents/biome.kit.json"]);
	});

	test("keeps the project's own AGENTS.md text and adds the kit's block; other tools' files move aside", () => {
		expect(read(root, "AGENTS.md")).toContain("Use pnpm");
		expect(read(root, "docs/legacy-agents.md")).toContain("Use the latest shadcn");
		expect(existsSync(join(root, ".cursorrules"))).toBe(false);
	});

	test("update keeps text outside the block, and a block the project changed, unless forced", () => {
		writeFileSync(join(root, "AGENTS.md"), `${read(root, "AGENTS.md")}\nproject note\n`);
		expect(apply(root, configFor({ addOns: ["seo", "hono"] }), "update").skipped).toEqual([]);
		expect(read(root, "AGENTS.md")).toContain("project note");
		writeFileSync(join(root, "AGENTS.md"), read(root, "AGENTS.md").replace("## Pick a lane first", "## Pick a lane first\nlocal edit"));
		const report = apply(root, configFor({ addOns: ["seo", "hono"] }), "update");
		expect(report.skipped.join("\n")).toContain("AGENTS.md (the kit block was changed");
		apply(root, configFor({ addOns: ["seo", "hono"] }), "update", true);
		expect(read(root, "AGENTS.md")).not.toContain("local edit");
		expect(read(root, "AGENTS.md")).toContain("project note");
	});

	test("removing an add-on takes its kit files back out", () => {
		expect(read(root, ".agents/skills/security/SKILL.md")).toContain("Hono API");
		apply(root, configFor({ addOns: ["seo"] }), "update");
		expect(read(root, ".agents/skills/security/SKILL.md")).not.toContain("Hono API");
		expect(read(root, "AGENTS.md")).not.toContain("Hono");
	});
});

describe("the install command", () => {
	test("detects an existing project's choices instead of assuming defaults", () => {
		const root = project();
		const cli = join(import.meta.dirname, "..", "..", "cli.ts");
		const result = spawnSync("bun", [cli, "install", root, "--no-skills"], { encoding: "utf8" });
		expect(result.status).toBe(0);
		expect(JSON.parse(read(root, ".agents/kit.json"))).toMatchObject({ runtime: "node", pm: "npm", deploy: "node", addOns: ["seo"] });
		expect(existsSync(join(root, "src/server"))).toBe(false);
	});
});

describe("the kit's block in AGENTS.md sits beside the frameworks' own blocks", () => {
	test("a Next.js or TanStack Intent block stays first; the kit's block follows; edits to theirs survive updates", () => {
		const root = project();
		const nextBlock = "<!-- BEGIN:nextjs-agent-rules -->\nRead node_modules/next/dist/docs.\n<!-- END:nextjs-agent-rules -->";
		writeFileSync(join(root, "AGENTS.md"), `${nextBlock}\n`);
		apply(root, configFor({ addOns: ["seo"] }), "create");
		const text = read(root, "AGENTS.md");
		expect(text.indexOf(nextBlock)).toBe(0);
		expect(text.indexOf(blockStart)).toBeGreaterThan(nextBlock.length);
		writeFileSync(join(root, "AGENTS.md"), text.replace("Read node_modules", "Always read node_modules"));
		expect(apply(root, configFor({ addOns: ["seo", "hono"] }), "update").skipped).toEqual([]);
		expect(read(root, "AGENTS.md")).toContain("Always read node_modules");
		expect(read(root, "AGENTS.md")).toContain("Hono serves");
	});
});
