// Works out an existing project's choices from its files, for `install`: flags given on the command line win.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { ChoiceFlags } from "./create/choices";

export function detectChoiceFlags(root: string): ChoiceFlags {
	const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
	const deps: Record<string, string> = { ...pkg.dependencies, ...pkg.devDependencies };
	const has = (name: string) => name in deps;
	const file = (name: string) => existsSync(join(root, name));
	const pm = file("bun.lock") || file("bun.lockb") ? "bun" : file("pnpm-lock.yaml") ? "pnpm" : "npm";
	const wrangler = ["wrangler.jsonc", "wrangler.json", "wrangler.toml"].find(file);
	const usesD1 = wrangler ? readFileSync(join(root, wrangler), "utf8").includes("d1_databases") : false;
	// React Email 6 is the `react-email` package; older projects have `@react-email/components`.
	const email = has("react-email") || has("@react-email/components");
	const ids = [
		"seo",
		...(file("components.json") ? ["shadcn"] : []),
		...(has("@tanstack/react-query") ? ["query"] : []),
		...(has("@tanstack/react-form") ? ["form"] : []),
		...(has("hono") ? ["hono"] : []),
		...(has("drizzle-orm") ? [usesD1 ? "d1" : "postgres"] : []),
		...(has("better-auth") ? ["auth"] : []),
		...(email ? [has("resend") ? "resend" : "zeptomail"] : []),
		wrangler ? "cloudflare" : file("vercel.json") ? "vercel" : "node",
	];
	return {
		framework: has("@tanstack/react-start") ? "tanstack-start" : has("next") ? "next" : undefined,
		pm,
		runtime: pm === "bun" ? "bun" : "node",
		addOns: ids.join(","),
	};
}
