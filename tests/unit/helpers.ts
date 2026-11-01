// Test helpers: throwaway projects that look like a fresh TanStack Start scaffold (or an existing app), and the kit
// applied to them through applyKit, without network or package installs.
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { applyKit } from "../../src/apply-kit";
import type { Choices, ProjectKitConfig } from "../../src/kit-config";
import { createReport, type Report } from "../../src/report";

export const read = (root: string, path: string) => readFileSync(join(root, path), "utf8");
export const scripts = (root: string): Record<string, string> => JSON.parse(read(root, "package.json")).scripts;

export function makeProject(options: { legacyAgentFiles?: boolean } = {}): string {
	const root = mkdtempSync(join(tmpdir(), "agent-ready-test-"));
	const pkg = {
		name: "test-app",
		private: true,
		type: "module",
		imports: { "#/*": "./src/*" },
		scripts: { dev: "vite dev --port 3000", build: "vite build", check: "biome check", "generate-routes": "tsr generate" },
		dependencies: { react: "^19", "@tanstack/react-start": "^1" },
	};
	writeFileSync(join(root, "package.json"), `${JSON.stringify(pkg, null, 2)}\n`);
	writeFileSync(
		join(root, "tsconfig.json"),
		'{\n  "compilerOptions": {\n    "paths": { "#/*": ["./src/*"], "@/*": ["./src/*"] },\n    "types": ["vite/client"],\n    /* Linting */\n    "strict": true\n  }\n}\n',
	);
	writeFileSync(join(root, "biome.json"), '{\n\t"$schema": "https://biomejs.dev/schemas/2.4.5/schema.json",\n\t"linter": { "enabled": true }\n}\n');
	writeFileSync(join(root, "tsr.config.json"), '{\n  "target": "react"\n}\n');
	writeFileSync(join(root, ".gitignore"), "node_modules\n");
	mkdirSync(join(root, "src/routes"), { recursive: true });
	writeFileSync(join(root, "src/router.tsx"), "// the scaffold's router\n");
	writeFileSync(join(root, "src/routes/__root.tsx"), "// the scaffold's root route\n");
	if (options.legacyAgentFiles) {
		writeFileSync(join(root, "AGENTS.md"), "# Old rules\n- Use pnpm\n");
		writeFileSync(join(root, ".cursorrules"), "Use the latest shadcn.\n");
	}
	spawnSync("git", ["init", "-q"], { cwd: root });
	spawnSync("git", ["config", "user.name", "Tester"], { cwd: root });
	spawnSync("git", ["config", "user.email", "tester@example.com"], { cwd: root });
	return root;
}

export const baseChoices: Choices = {
	framework: "tanstack-start",
	runtime: "bun",
	pm: "bun",
	deploy: "cloudflare",
	addOns: ["seo"],
	skills: [],
};

export function configFor(choices: Partial<Choices> = {}): ProjectKitConfig {
	return { ...baseChoices, ...choices, kitVersion: "0.1.0", name: "test-app", createdOn: "2026-11-01" };
}

// mode "create" overlays a scaffold; "install" adds only the agent setup; "update" refreshes kit files. Community
// skills are never installed here (that needs the network): their install is covered by verify:build.
export function apply(root: string, config: ProjectKitConfig, mode: "create" | "install" | "update", force = false): Report {
	const report = createReport();
	applyKit(root, config, { dryRun: false, force, skills: false, create: mode === "create", appFiles: mode === "create" }, report);
	return report;
}
