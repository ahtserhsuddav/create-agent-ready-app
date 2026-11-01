import { afterAll, describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { allowPnpmBuilds } from "../../src/create/scaffold-base";
import { designFileText, parseCatalog } from "../../src/design-md";
import { excludeFromTsconfig } from "../../src/merge-project-files";
import { renderTemplate } from "../../src/render-template";
import { createReport } from "../../src/report";
import { runStreaming } from "../../src/run";

const dirs: string[] = [];
afterAll(() => {
	for (const dir of dirs) rmSync(dir, { recursive: true, force: true });
});

describe("templates", () => {
	test("inline blocks nest on one line", () => {
		const text = "- {{#server}}a {{#next}}actions{{/next}}{{#tanstack-start}}functions{{/tanstack-start}} b{{/server}}";
		expect(renderTemplate(text, new Set(["server", "next"]), {})).toBe("- a actions b");
		expect(renderTemplate(text, new Set(["tanstack-start"]), {})).toBe("- ");
	});

	test("an inline block that spans lines is an error, never a silent leftover", () => {
		expect(() => renderTemplate("a {{#db}}b\nc{{/db}}", new Set(["db"]), {})).toThrow("no partner on the same line");
	});
});

describe("design languages", () => {
	test("a picked DESIGN.md keeps its frontmatter first and credits its source right after", () => {
		const text = designFileText("stripe", "---\nname: x\n---\n\n## 1. Visual theme\n");
		expect(text.startsWith("---\nname: x\n---\n")).toBe(true);
		expect(text).toContain('the "stripe" design language from awesome-design-md (MIT');
		expect(text.indexOf("awesome-design-md")).toBeLessThan(text.indexOf("## 1. Visual theme"));
		expect(text).toContain('- Base: awesome-design-md "stripe"');
		expect(text.indexOf("## 1. Visual theme")).toBeLessThan(text.indexOf("## Design inputs"));
	});

	test("the catalog is read from the README with each entry's description", () => {
		const readme = "### Developer Tools\n\n- [**Linear**](https://getdesign.md/linear.app/design-md) - Ultra-minimal, purple accent\n- not an entry\n";
		expect(parseCatalog(readme)).toEqual([{ label: "Linear", name: "linear.app", description: "Ultra-minimal, purple accent" }]);
	});
});

describe("merges", () => {
	test("pnpm projects allow esbuild's build and keep what the scaffolder decided", () => {
		const dir = mkdtempSync(join(tmpdir(), "agent-ready-pnpm-"));
		dirs.push(dir);
		const path = join(dir, "pnpm-workspace.yaml");
		writeFileSync(path, "allowBuilds:\n  esbuild: set this to true or false\n  sharp: false\n");
		allowPnpmBuilds(dir, { pm: "pnpm" } as Parameters<typeof allowPnpmBuilds>[1]);
		expect(readFileSync(path, "utf8")).toBe("allowBuilds:\n  esbuild: true\n  sharp: false\n");
		allowPnpmBuilds(dir, { pm: "bun" } as Parameters<typeof allowPnpmBuilds>[1]);
		expect(readFileSync(path, "utf8")).toContain("esbuild: true");
	});

	test("tsconfig gets an exclude list with node_modules and the agent folders, once", () => {
		const dir = mkdtempSync(join(tmpdir(), "agent-ready-tsconfig-"));
		dirs.push(dir);
		const path = join(dir, "tsconfig.json");
		writeFileSync(path, '{\n  "compilerOptions": { "strict": true },\n  "include": ["**/*.ts"]\n}\n');
		excludeFromTsconfig(path, [".agents", ".claude"], createReport(), false);
		excludeFromTsconfig(path, [".agents", ".claude"], createReport(), false);
		const config = JSON.parse(readFileSync(path, "utf8"));
		expect(config.exclude).toEqual(["node_modules", ".agents", ".claude"]);
	});
});

describe("running commands", () => {
	test("runStreaming hands over each line as it arrives, including progress redraws", async () => {
		const lines: string[] = [];
		const result = await runStreaming("node", ["-e", "process.stdout.write('one\\ntwo\\r\\x1b[32mthree\\x1b[0m\\n'); console.error('four')"], tmpdir(), (line) =>
			lines.push(line),
		);
		expect(result.code).toBe(0);
		expect(lines).toEqual(["one", "two", "three", "four"]);
	});
});
