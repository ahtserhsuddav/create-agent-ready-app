import { afterAll, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { detectChoiceFlags } from "../../src/detect";

const roots: string[] = [];
afterAll(() => {
	for (const root of roots) rmSync(root, { recursive: true, force: true });
});
function projectWith(dependencies: Record<string, string>, files: Record<string, string> = {}) {
	const root = mkdtempSync(join(tmpdir(), "agent-ready-detect-"));
	roots.push(root);
	writeFileSync(join(root, "package.json"), JSON.stringify({ dependencies: { "@tanstack/react-start": "^1", ...dependencies } }));
	for (const [name, content] of Object.entries(files)) writeFileSync(join(root, name), content);
	return root;
}

describe("detecting an existing project's choices", () => {
	test("email: React Email 6 (react-email) and the older @react-email/components both count", () => {
		expect(detectChoiceFlags(projectWith({ "react-email": "^6", resend: "^6" }))).toMatchObject({ addOns: "seo,resend,node" });
		expect(detectChoiceFlags(projectWith({ "@react-email/components": "^1" }))).toMatchObject({ addOns: "seo,zeptomail,node" });
	});

	test("database and deploy: D1 and Cloudflare from wrangler, Postgres and a Node server otherwise", () => {
		const d1 = projectWith({ "drizzle-orm": "^0.45" }, { "wrangler.jsonc": '{ "d1_databases": [] }', "bun.lock": "" });
		expect(detectChoiceFlags(d1)).toMatchObject({ pm: "bun", runtime: "bun", addOns: "seo,d1,cloudflare" });
		expect(detectChoiceFlags(projectWith({ "drizzle-orm": "^0.45" }))).toMatchObject({ pm: "npm", addOns: "seo,postgres,node" });
	});
});
