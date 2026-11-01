import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { renderFlags } from "../../src/kit-config";
import {
	compareVersions,
	lineOf,
	type Packument,
	pickAddOnVersion,
	pickScaffoldVersion,
	setPackageVersions,
} from "../../src/create/versions";
import { configFor } from "./helpers";

const packument = (latest: string, versions: string[]): Packument => ({ distTags: { latest }, versions });

describe("version picking", () => {
	test("semver order and release lines", () => {
		expect(["1.10.0", "1.2.0", "1.2.0-rc.1", "0.45.4"].sort(compareVersions)).toEqual(["0.45.4", "1.2.0-rc.1", "1.2.0", "1.10.0"]);
		expect(lineOf("19.3.1")).toBe("19");
		expect(lineOf("0.45.4")).toBe("0.45");
	});

	test("scaffold packages stay on the major TanStack chose, at its newest release", () => {
		const typescript = packument("7.0.2", ["6.0.2", "6.0.3", "7.0.0", "7.0.2"]);
		expect(pickScaffoldVersion("^6.0.2", typescript)).toBe("6.0.3");
		const router = packument("1.170.46", ["1.169.4", "1.170.46"]);
		expect(pickScaffoldVersion("1.169.4", router)).toBe("1.170.46");
	});

	test("a scaffold prerelease moves to a newer prerelease on its line, never backwards", () => {
		const nitro = packument("3.0.261029-rc", ["2.9.0", "3.0.260610-beta", "3.0.261029-rc"]);
		expect(pickScaffoldVersion("3.0.260610-beta", nitro)).toBe("3.0.261029-rc");
		expect(pickScaffoldVersion("3.0.261029-rc", packument("2.9.0", ["2.9.0", "3.0.261029-rc"]))).toBe("3.0.261029-rc");
	});

	test("add-on packages take latest, or the verified line when asked", () => {
		const hono = packument("4.13.14", ["4.12.0", "4.13.14"]);
		expect(pickAddOnVersion("hono", hono, "latest")).toEqual({ version: "4.13.14" });
		const drizzle = packument("1.0.0", ["0.45.3", "0.45.4", "1.0.0"]);
		expect(pickAddOnVersion("drizzle-orm", drizzle, "latest")).toEqual({ version: "1.0.0" });
		expect(pickAddOnVersion("drizzle-orm", drizzle, "verified")).toEqual({ version: "0.45.4" });
	});

	test("package.json gets ^ranges for the scaffold's and the chosen add-ons' packages", async () => {
		const root = mkdtempSync(join(tmpdir(), "agent-ready-versions-"));
		writeFileSync(join(root, "package.json"), JSON.stringify({ name: "x", dependencies: { react: "^19.2.0" }, devDependencies: { typescript: "^6.0.2", "@types/node": "^20" } }));
		const versions: Record<string, Packument> = {
			react: packument("19.3.1", ["19.2.0", "19.3.1"]),
			typescript: packument("7.0.2", ["6.0.2", "6.0.3", "7.0.2"]),
			hono: packument("4.13.14", ["4.13.14"]),
			"@hono/zod-validator": packument("0.9.1", ["0.9.1"]),
			zod: packument("4.6.7", ["4.6.7"]),
			"@types/node": packument("26.6.6", ["20.19.43", "22.20.5", "26.6.6"]),
		};
		const fetcher = async (name: string) => versions[name] ?? packument("1.0.0", ["1.0.0"]);
		const resolved = await setPackageVersions(root, renderFlags(configFor({ addOns: ["hono"] })), "latest", fetcher);
		const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
		expect(pkg.dependencies).toMatchObject({ react: "^19.3.1", hono: "^4.13.14", "@hono/zod-validator": "^0.9.1", zod: "^4.6.7" });
		expect(pkg.devDependencies).toMatchObject({ typescript: "^6.0.3", knip: "^1.0.0", vitest: "^1.0.0" });
		// manifest.scaffoldLines: @types/node follows the Node version projects require, not the scaffolder's ^20.
		expect(pkg.devDependencies["@types/node"]).toBe("^22.20.5");
		expect(pkg.dependencies["drizzle-orm"]).toBeUndefined();
		expect(resolved.find((item) => item.name === "typescript")?.newerThanVerified).toBe(false);
	});
});
