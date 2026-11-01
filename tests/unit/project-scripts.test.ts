// The agent scripts as a project gets them (rendered for its add-ons), run against throwaway projects.
import { afterAll, describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Choices } from "../../src/kit-config";
import { apply, configFor, makeProject, read } from "./helpers";

const projects: string[] = [];
afterAll(() => {
	for (const root of projects) rmSync(root, { recursive: true, force: true });
});

function created(choices: Partial<Choices>) {
	const root = makeProject();
	projects.push(root);
	apply(root, configFor(choices), "create");
	return root;
}

// The scripts are imported from the project, so new-feature reads that project's rendered templates.
const script = async (root: string, name: string) => import(join(root, "scripts/agent", `${name}.ts`));

describe("task:new, log and scope", () => {
	const root = created({ addOns: ["seo"] });

	test("a task file is tiny and names its owner", async () => {
		const { createTask } = await script(root, "task-new");
		const path: string = createTask(root, "Redesign pricing page", { by: "codex", scope: ["src/features/pricing/**"] });
		expect(path).toMatch(/^tasks\/\d{4}-\d{2}-\d{2}-redesign-pricing-page\.md$/);
		expect(read(root, path)).toContain("Owner: Tester (codex)");
		expect(read(root, path).trimEnd().split("\n").length).toBeLessThanOrEqual(15);
	});

	test("a log line says when, who, where and what", async () => {
		spawnSync("git", ["add", "-A"], { cwd: root });
		spawnSync("git", ["commit", "-qm", "kit"], { cwd: root });
		mkdirSync(join(root, "src/features/pricing"), { recursive: true });
		writeFileSync(join(root, "src/features/pricing/content.ts"), "export const pricingContent = {}\n");
		const { logChange } = await script(root, "log");
		const line: string = logChange(root, "New pricing page", { by: "claude" });
		expect(line).toMatch(/^- \d{4}-\d{2}-\d{2} \d{2}:\d{2} · Tester \(claude\) · pricing · New pricing page$/);
	});

	test("scope flags changed files outside the task", async () => {
		const { createTask } = await script(root, "task-new");
		const { checkScope, readScope } = await script(root, "scope");
		const task: string = createTask(root, "Billing", { scope: ["src/features/billing/**"] });
		writeFileSync(join(root, "src/stray.ts"), "export {}\n");
		expect(readScope(read(root, task))).toEqual(["src/features/billing/**"]);
		expect(checkScope(root, [task]).outside).toContain("src/stray.ts");
	});
});

describe("new:feature", () => {
	test("names come out readable", async () => {
		const root = created({ addOns: ["seo"] });
		const { featureNames, singular } = await script(root, "new-feature");
		expect(["invoices", "categories", "addresses", "team-members"].map(singular)).toEqual(["invoice", "category", "address", "team-member"]);
		expect(featureNames("team-members")).toMatchObject({ __camel__: "teamMembers", __snake__: "team_members", __apiKey__: "['team-members']" });
		expect(featureNames("invoices").__apiKey__).toBe(".invoices");
	});

	test("without a database a feature is page copy only", async () => {
		const root = created({ addOns: ["seo"] });
		const { scaffoldFeature } = await script(root, "new-feature");
		expect(scaffoldFeature(root, "pricing", { task: false }).created).toEqual(["src/features/pricing/content.ts"]);
	});

	test("with Hono and Query: routes, RPC hooks, service, tables, wired in", async () => {
		const root = created({ addOns: ["query", "hono", "db"], db: "postgres" });
		const { scaffoldFeature } = await script(root, "new-feature");
		const result = scaffoldFeature(root, "team-members", { by: "claude" });
		expect(result.created).toContain("src/features/team-members/server/routes.ts");
		expect(result.created).toContain("src/features/team-members/hooks/use-team-members.ts");
		expect(result.created).not.toContain("src/features/team-members/functions.ts");
		expect(read(root, "src/features/team-members/hooks/use-team-members.ts")).toContain("getApi()['team-members'].$get()");
		expect(read(root, "src/server/api/hono/app.ts")).toContain(".route('/team-members', teamMembersRoutes)");
		expect(read(root, "src/server/db/drizzle/tables.ts")).toContain("export * from '#/features/team-members/server/tables'");
		expect(read(root, "src/server/db/drizzle/tables.ts")).not.toContain("export {}");
		expect(read(root, "src/features/team-members/server/tables.ts")).toContain("pgTable('team_members'");
		expect(read(root, result.task)).toContain("- src/server/api/hono/app.ts");
		expect(() => scaffoldFeature(root, "team-members")).toThrow("already exists");
		expect(() => scaffoldFeature(root, "Team_Members")).toThrow("kebab-case");
	});

	test("without Hono: server functions, on D1 tables", async () => {
		const root = created({ addOns: ["db"], db: "d1" });
		const { scaffoldFeature } = await script(root, "new-feature");
		const result = scaffoldFeature(root, "invoices", { task: false });
		expect(result.created).toContain("src/features/invoices/functions.ts");
		expect(result.created.some((path: string) => path.includes("/hooks/"))).toBe(false);
		expect(read(root, "src/features/invoices/server/tables.ts")).toContain("sqliteTable('invoices'");
		expect(existsSync(join(root, "src/server/api/hono/app.ts"))).toBe(false);
	});
});

describe("docs:sync and docs:get", () => {
	test("indexes installed packages and marks unknown ones", async () => {
		const root = created({ addOns: ["hono"] });
		const pkg = JSON.parse(read(root, "package.json"));
		pkg.dependencies = { hono: "^4", "left-pad": "^1" };
		writeFileSync(join(root, "package.json"), JSON.stringify(pkg));
		mkdirSync(join(root, "node_modules/hono"), { recursive: true });
		writeFileSync(join(root, "node_modules/hono/package.json"), '{"version":"4.13.14"}');
		const fetchText = async (url: string) =>
			url.includes("registry.npmjs.org") ? '{"homepage":"https://github.com/left-pad/left-pad"}' : `# index for ${url}`;
		const { syncDocs } = await script(root, "docs-sync");
		const { unverified } = await syncDocs(root, { fetchText });
		const index = read(root, "docs/official/INDEX.md");
		expect(unverified).toEqual(["left-pad"]);
		expect(index).toContain("| hono | 4.13.14 | https://hono.dev/docs/ |");
		expect(index).toContain("| cloudflare-workers |");
		expect(index).not.toContain("| node |");
	});

	test("saves one page as Markdown and prints its outline", async () => {
		const root = created({ addOns: [] });
		const { getDocsPage, htmlToText } = await script(root, "docs-get");
		const fetcher = async (url: string) =>
			url.endsWith(".md") ? new Response("# Middleware\n\nIntro\n\n## Built-in\n\nText\n") : new Response("no", { status: 404 });
		const page = await getDocsPage(root, "https://hono.dev/docs/guides/middleware", { fetcher });
		expect(page.outline).toEqual(["L1 # Middleware", "L5 ## Built-in"]);
		expect(htmlToText("<h2>Title</h2><p>One &amp; two</p><script>x()</script>")).toBe("## Title\n\nOne & two");
	});
});

describe("design:md", () => {
	test("lists the catalog by category and replaces only the kit's empty DESIGN.md without --force", async () => {
		const root = created({ addOns: [] });
		const { parseCatalog, useDesign } = await script(root, "design-md");
		const readme = "### Productivity & SaaS\n\n- [**Linear**](https://getdesign.md/linear.app/design-md) - Ultra-minimal, purple accent\n";
		expect(parseCatalog(readme)).toEqual([
			{ label: "Linear", name: "linear.app", category: "Productivity & SaaS", description: "Ultra-minimal, purple accent" },
		]);
		const fetcher = async () => new Response('---\nname: Linear\ncolors:\n  primary: "#5e6ad2"\n---\n\n## 1. Visual theme\n');
		await useDesign(root, "linear.app", { fetcher });
		const design = read(root, "design/DESIGN.md");
		expect(design).toContain('the "linear.app" design language from awesome-design-md');
		expect(design).toContain('- Base: awesome-design-md "linear.app"');
		await expect(useDesign(root, "stripe", { fetcher })).rejects.toThrow("--force");
		await useDesign(root, "stripe", { fetcher, force: true });
		expect(read(root, "design/DESIGN.md")).toContain('"stripe" design language');
	});
});
