import { describe, expect, test } from "bun:test";
import {
	applyIds,
	availableIds,
	choicesFromFlags,
	describeChoices,
	detectPackageManager,
	findMissingRequirements,
	idProblems,
	idsOf,
	resolveRequirement,
	skillCount,
} from "../../src/create/choices";

describe("choices from flags", () => {
	test("the package manager that ran us decides the runtime unless flags say otherwise", () => {
		expect(detectPackageManager("pnpm/10.0.0 npm/? node/v24")).toBe("pnpm");
		expect(detectPackageManager("bun/1.4.2")).toBe("bun");
		expect(detectPackageManager("")).toBe("npm");
		expect(choicesFromFlags({}, "pnpm")).toMatchObject({ runtime: "node", pm: "pnpm", deploy: "node", addOns: ["seo"], skills: [] });
		expect(choicesFromFlags({}, "bun")).toMatchObject({ runtime: "bun", pm: "bun" });
		expect(choicesFromFlags({ runtime: "node" }, "bun")).toMatchObject({ runtime: "node", pm: "npm" });
	});

	test("add-on ids cover the stack: a database, an email service and a deploy target are add-ons too", () => {
		const choices = choicesFromFlags({ addOns: "shadcn,hono,postgres,auth,resend,cloudflare" }, "bun");
		expect(choices).toMatchObject({ addOns: ["shadcn", "hono", "db", "auth", "email"], db: "postgres", email: "resend", deploy: "cloudflare" });
		expect(idsOf(choices).sort()).toEqual(["auth", "cloudflare", "hono", "postgres", "resend", "shadcn"]);
	});

	test("presets pick add-ons; --skills adds optional skill packs", () => {
		const app = choicesFromFlags({ preset: "app", skills: "marketing,payments" }, "bun");
		expect(app.addOns).toEqual(["shadcn", "query", "form", "hono", "db", "auth", "seo"]);
		expect(app).toMatchObject({ db: "postgres", email: undefined, deploy: "node", skills: ["marketing", "payments"] });
	});

	test('"none" means no add-ons at all', () => {
		expect(choicesFromFlags({ addOns: "none" }, "bun").addOns).toEqual([]);
		expect(choicesFromFlags({ addOns: "" }, "bun").addOns).toEqual([]);
	});

	test("unknown, misplaced or doubled picks fail with one clear message", () => {
		expect(() => choicesFromFlags({ runtime: "bun", pm: "npm" }, "bun")).toThrow("--runtime bun works with --pm bun");
		expect(() => choicesFromFlags({ addOns: "seo,graphql" }, "bun")).toThrow('"graphql" is not one of');
		expect(() => choicesFromFlags({ preset: "huge" }, "bun")).toThrow("--preset must be one of");
		expect(() => choicesFromFlags({ addOns: "postgres,d1" }, "bun")).toThrow("Pick one database");
		expect(() => choicesFromFlags({ addOns: "vercel,cloudflare" }, "bun")).toThrow("Pick one deployment");
		expect(() => choicesFromFlags({ skills: "next-workflows" }, "bun")).toThrow("Next.js workflows is not available for TanStack Start");
	});

	test("a framework only offers what fits it", () => {
		expect(availableIds("tanstack-start")).not.toContain("next-workflows");
		expect(idProblems(["resend", "zeptomail"], "tanstack-start")).toEqual(["Pick one email, not Resend and ZeptoMail"]);
	});
});

describe("requirements are reported, never added silently", () => {
	test("Better Auth needs a database, and D1 needs Cloudflare", () => {
		expect(findMissingRequirements(choicesFromFlags({ addOns: "auth" }, "bun"))).toEqual([
			{ item: "auth", label: "Better Auth", needs: "postgres", needsLabel: "a database (Postgres (Drizzle))" },
		]);
		expect(findMissingRequirements(choicesFromFlags({ addOns: "d1" }, "bun"))).toMatchObject([{ item: "d1", needs: "cloudflare" }]);
	});

	test("answering adds what is needed, or drops what needs it", () => {
		const choices = choicesFromFlags({ addOns: "auth" }, "bun");
		const need = findMissingRequirements(choices)[0];
		if (!need) throw new Error("expected a requirement");
		expect(resolveRequirement(choices, need, true)).toMatchObject({ addOns: ["db", "auth"], db: "postgres" });
		expect(resolveRequirement(choices, need, false)).toMatchObject({ addOns: [] });
		const d1 = choicesFromFlags({ addOns: "d1,vercel" }, "bun");
		const deployNeed = findMissingRequirements(d1)[0];
		if (!deployNeed) throw new Error("expected a requirement");
		expect(resolveRequirement(d1, deployNeed, true)).toMatchObject({ deploy: "cloudflare", db: "d1" });
	});

	test("the summary lists what was chosen, with the skills it brings", () => {
		const lines = describeChoices(choicesFromFlags({ addOns: "seo,shadcn" }, "pnpm"));
		expect(lines).toContain("Runtime      Node.js · pnpm");
		expect(lines).toContain("Deploy       Node server");
		expect(lines.some((line) => line.startsWith("Database"))).toBe(false);
		expect(lines.find((line) => line.startsWith("Agent skills"))).toMatch(/^Agent skills \d+ from \d+ sources$/);
	});

	test("add-ons bring their skill packs: more add-ons, more skills", () => {
		const bare = skillCount(applyIds({ framework: "tanstack-start", runtime: "bun", pm: "bun" }, []));
		const full = skillCount(choicesFromFlags({ preset: "full", skills: "marketing" }, "bun"));
		expect(full.skills).toBeGreaterThan(bare.skills);
		expect(full.sources).toBeGreaterThan(bare.sources);
	});
});
