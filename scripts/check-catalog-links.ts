#!/usr/bin/env bun
// Checks every URL in the website-design catalogs still answers. 401/403/429 mean "alive but blocks bots".
// Usage: bun run check-links
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const dir = join(import.meta.dirname, "../template/agent/.agents/skills/website-design/references");
const urls = [...new Set(readdirSync(dir).flatMap((file) => readFileSync(join(dir, file), "utf8").match(/https:\/\/[^\s)|`*]+/g) ?? []))];
const botBlocked = new Set([401, 403, 429]);
const failures: string[] = [];

await Promise.all(
	urls.map(async (url) => {
		const response = await fetch(url, { redirect: "follow", headers: { "User-Agent": "Mozilla/5.0 agent-ready link check" } }).catch(() => undefined);
		if (!response || (!response.ok && !botBlocked.has(response.status))) failures.push(`${response?.status ?? "no answer"} ${url}`);
	}),
);
console.log(`${urls.length - failures.length}/${urls.length} catalog links answer`);
for (const failure of failures.sort()) console.log(`✗ ${failure}`);
process.exit(failures.length ? 1 : 0);
