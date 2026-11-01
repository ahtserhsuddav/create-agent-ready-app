// Every add-on is optional: a project must not get a file, package, script, skill or AGENTS.md line from an add-on
// it didn't choose. These tests render the templates for several choices and look for leaks.
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { listTemplateFiles } from "../../src/apply-kit";
import { activeKeys, appliesTo, type Choices, manifest, renderFlags, renderVars, ruleFor } from "../../src/kit-config";
import { renderTemplate } from "../../src/render-template";
import { configFor } from "./helpers";

function rendered(choices: Partial<Choices>) {
	const config = configFor(choices);
	const flags = renderFlags(config);
	const vars = renderVars(config);
	const files = new Map<string, string>();
	for (const file of listTemplateFiles(config.framework)) {
		if (!appliesTo(ruleFor(file.path).when, flags)) continue;
		files.set(file.path, renderTemplate(readFileSync(file.source, "utf8"), flags, vars));
	}
	const packages = activeKeys(manifest.packages, flags).flatMap((group) => [...(group.deps ?? []), ...(group.dev ?? [])]);
	const scripts = Object.assign({}, ...activeKeys(manifest.scripts, flags));
	return { files, packages, scripts, paths: [...files.keys()] };
}

describe("a project with no add-ons", () => {
	const project = rendered({ addOns: [] });

	test("has no server code, server packages or add-on skills", () => {
		expect(project.paths.filter((path) => path.startsWith("src/server/") || path.startsWith("src/features/"))).toEqual([]);
		for (const name of ["hono", "drizzle-orm", "better-auth", "@tanstack/react-query", "@tanstack/react-form", "react-email"]) {
			expect(project.packages).not.toContain(name);
		}
		expect(project.paths).not.toContain(".agents/skills/database-change/SKILL.md");
		expect(project.paths).not.toContain(".agents/skills/seo-aeo/SKILL.md");
		expect(Object.keys(project.scripts).filter((name) => /^(db|auth|email):/.test(name))).toEqual([]);
	});

	test("AGENTS.md and the structure skill only talk about what exists", () => {
		const agents = project.files.get("AGENTS.md") ?? "";
		for (const word of ["Hono", "Drizzle", "Better Auth", "shadcn", "TanStack Query", "{{"]) expect(agents).not.toContain(word);
		expect(agents).toContain("Static site");
		const structure = project.files.get(".agents/skills/project-structure/SKILL.md") ?? "";
		expect(structure).not.toContain("api/hono");
		expect(structure).not.toContain("better-auth");
	});

	test("the SVG converter is always there", () => {
		expect(project.files.get("vite.config.ts")).toContain("svgr(");
		expect(project.packages).toContain("vite-plugin-svgr");
	});
});

describe("each add-on brings only its own pieces", () => {
	test("Hono without a database or auth has no db or auth code", () => {
		const { paths, files } = rendered({ addOns: ["hono", "query"] });
		expect(paths).toContain("src/server/api/hono/app.ts");
		expect(paths.some((path) => path.startsWith("src/server/db/") || path.startsWith("src/server/auth/"))).toBe(false);
		const middleware = files.get("src/server/api/hono/middleware.ts") ?? "";
		expect(middleware).toContain("export const validate");
		expect(middleware).not.toContain("withDb");
		expect(middleware).not.toContain("createMiddleware");
	});

	test("auth pages need Form, shadcn/ui and Query; without them only the server side is set up", () => {
		const bare = rendered({ addOns: ["db", "auth"], db: "postgres" });
		expect(bare.paths).toContain("src/server/auth/better-auth/setup.ts");
		expect(bare.paths).toContain("src/routes/_private/route.tsx");
		expect(bare.paths.some((path) => path.startsWith("src/routes/_auth/"))).toBe(false);
		expect(bare.files.get("src/routes/_private/route.tsx")).toContain("throw redirect({ to: '/' })");
		const full = rendered({ addOns: ["shadcn", "query", "form", "db", "auth"], db: "postgres" });
		expect(full.paths).toContain("src/routes/_auth/sign-in.tsx");
		expect(full.paths).toContain("src/routes/_auth/sign-up.tsx");
		expect(full.paths).not.toContain("src/routes/_auth/forgot-password.tsx");
	});

	test("auth is email and password; with Email it also verifies addresses and resets passwords", () => {
		const { paths, files } = rendered({ addOns: ["shadcn", "query", "form", "db", "auth", "email"], db: "d1", email: "zeptomail" });
		expect(paths).toContain("src/routes/_auth/forgot-password.tsx");
		expect(paths).toContain("src/server/email/templates/reset-password-email.tsx");
		expect(paths).toContain("src/server/email/zeptomail/send.ts");
		expect(paths).not.toContain("src/server/email/resend/send.ts");
		const setup = files.get("src/server/auth/better-auth/setup.ts") ?? "";
		expect(setup).toContain("provider: 'sqlite'");
		expect(setup).toContain("sendResetPassword");
		expect(setup).toContain("waitUntil(sending)");
		expect(setup).toContain("tanstackStartCookies()");
		expect(setup).not.toContain("nextCookies");
		const alone = rendered({ addOns: ["email"], email: "resend" });
		expect(alone.paths).toContain("src/server/email/templates/welcome-email.tsx");
		expect(alone.packages).toContain("resend");
	});

	test("Cloudflare, Vercel and a Node server each get their own database connection", () => {
		const cloudflare = rendered({ addOns: ["db"], db: "postgres" }).files.get("src/server/db/drizzle/client.ts") ?? "";
		expect(cloudflare).toContain("env.HYPERDRIVE.connectionString");
		const node = rendered({ addOns: ["db"], db: "postgres", deploy: "node" }).files.get("src/server/db/drizzle/client.ts") ?? "";
		expect(node).toContain("getEnv().DATABASE_URL");
		expect(node).not.toContain("cloudflare:workers");
		expect(node).not.toContain("attachDatabasePool");
		const vercel = rendered({ addOns: ["db"], db: "postgres", deploy: "vercel" });
		expect(vercel.files.get("src/server/db/drizzle/client.ts")).toContain("attachDatabasePool(pool)");
		expect(vercel.packages).toContain("@vercel/functions");
	});
});

describe("agent skills", () => {
	test("AGENTS.md lists the community skills the project gets, and nothing else", () => {
		const bare = rendered({ addOns: [] }).files.get("AGENTS.md") ?? "";
		expect(bare).toContain("vercel-react-best-practices");
		expect(bare).toContain("design-taste-frontend");
		expect(bare).toContain("playwright-cli");
		expect(bare).toContain("grill-me");
		expect(bare).not.toContain("better-auth-best-practices");
		expect(bare).not.toContain("seo-audit");
		const chosen = rendered({ addOns: ["db", "auth"], db: "postgres", skills: ["marketing"] }).files.get("AGENTS.md") ?? "";
		expect(chosen).toContain("better-auth-best-practices");
		expect(chosen).toContain("supabase-postgres-best-practices");
		expect(chosen).toContain("seo-audit");
	});

	test("TanStack projects point agents at the skills TanStack ships in its packages", () => {
		const { files, packages } = rendered({ addOns: [] });
		expect(files.get("AGENTS.md")).toContain("intent-skills");
		expect(packages).toContain("@tanstack/intent");
	});
});

describe("Next.js projects", () => {
	const full = rendered({
		framework: "next",
		deploy: "vercel",
		addOns: ["shadcn", "query", "form", "hono", "db", "auth", "email", "seo"],
		db: "postgres",
		email: "resend",
		skills: ["next-workflows"],
	});

	test("get App Router files, never TanStack's", () => {
		for (const path of [
			"src/app/(private)/layout.tsx",
			"src/app/(auth)/reset-password/page.tsx",
			"src/app/api/[[...route]]/route.ts",
			"src/app/api/auth/[...all]/route.ts",
			"src/server/auth/better-auth/session.ts",
			"src/shared/lib/tanstack/query-provider.tsx",
			"src/features/auth/hooks/use-auth.ts",
		]) {
			expect(full.paths).toContain(path);
		}
		expect(full.paths.some((path) => path.startsWith("src/routes/") || path.endsWith("functions.ts"))).toBe(false);
		expect(full.paths).not.toContain("vite.config.ts");
		expect(full.packages).toContain("@hono/vercel");
		expect(full.packages).not.toContain("@tanstack/intent");
	});

	test("share the server code, with Next.js's own cookies plugin and background email", () => {
		const setup = full.files.get("src/server/auth/better-auth/setup.ts") ?? "";
		expect(setup).toContain("nextCookies()");
		expect(setup).toContain("after(sending)");
		expect(setup).not.toContain("tanstack");
		expect(full.files.get("src/server/email/resend/send.ts")).toContain("process.env.NODE_ENV === 'production'");
		expect(full.files.get("src/shared/components/form/text-field.tsx")?.startsWith("'use client'")).toBe(true);
	});

	test("point agents at Next.js's bundled docs and dev loop, not TanStack Intent", () => {
		const agents = full.files.get("AGENTS.md") ?? "";
		expect(agents).toContain("node_modules/next/dist/docs/");
		expect(agents).toContain("next-dev-loop");
		expect(agents).toContain("next-bundle-optimizer");
		expect(agents).not.toContain("intent-skills");
		expect(agents).toContain("`src/app/`");
	});

	test("on Cloudflare, run through OpenNext with bindings from getCloudflareContext", () => {
		const cf = rendered({ framework: "next", addOns: ["db", "auth"], db: "d1" });
		expect(cf.paths).toContain("wrangler.jsonc");
		expect(cf.paths).toContain("open-next.config.ts");
		expect(cf.files.get("src/server/config/env.ts")).toContain("getCloudflareContext().env");
		expect(cf.files.get("src/server/db/drizzle/client.ts")).not.toContain("cloudflare:workers");
		expect(cf.packages).toContain("@opennextjs/cloudflare");
		expect(cf.scripts.deploy).toContain("opennextjs-cloudflare deploy");
		expect(cf.scripts.build).toBe("next build");
	});
});
