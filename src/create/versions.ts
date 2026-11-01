// Picks the version of every package a new project gets, on the day it is created:
// - the scaffold's packages: the newest release in the major TanStack's own scaffold chose (never older than it);
// - add-on packages: the newest release (latest), or the newest within the verified major with --versions verified;
// - manifest.holdBack caps a package whose newest major is known to break the stack.
// The versions go into package.json as ^ranges and one install follows, the same for bun, pnpm and npm.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { activeKeys, manifest } from "../kit-config";

export type VersionPolicy = "latest" | "verified";
export type Packument = { distTags: Record<string, string>; versions: string[] };
export type FetchPackument = (name: string) => Promise<Packument>;
export type ResolvedPackage = { name: string; version: string; dev: boolean; newerThanVerified: boolean; heldBack?: string };

type Parsed = { major: number; minor: number; patch: number; pre: string };

function parse(version: string): Parsed | undefined {
	const match = version.match(/^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?/);
	return match ? { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]), pre: match[4] ?? "" } : undefined;
}

function comparePre(a: string, b: string): number {
	if (a === b) return 0;
	if (!a) return 1; // a release is newer than its prereleases
	if (!b) return -1;
	const left = a.split(".");
	const right = b.split(".");
	for (let index = 0; index < Math.max(left.length, right.length); index++) {
		const x = left[index];
		const y = right[index];
		if (x === undefined) return -1;
		if (y === undefined) return 1;
		const numeric = /^\d+$/.test(x) && /^\d+$/.test(y);
		const order = numeric ? Number(x) - Number(y) : x.localeCompare(y);
		if (order !== 0) return order;
	}
	return 0;
}

export function compareVersions(a: string, b: string): number {
	const x = parse(a);
	const y = parse(b);
	if (!x || !y) return 0;
	return x.major - y.major || x.minor - y.minor || x.patch - y.patch || comparePre(x.pre, y.pre);
}

// The release line a caret range stays on: "19" for 19.x, "0.45" for 0.45.x (caret rules for 0.x).
export function lineOf(version: string): string {
	const parsed = parse(version);
	if (!parsed) return version;
	return parsed.major > 0 ? String(parsed.major) : `0.${parsed.minor}`;
}

const onLine = (version: string, line: string) => lineOf(version) === line;
const isPrerelease = (version: string) => Boolean(parse(version)?.pre);

function newestOnLine(packument: Packument, line: string, atLeast?: string): string | undefined {
	return packument.versions
		.filter((version) => onLine(version, line) && !isPrerelease(version) && (!atLeast || compareVersions(version, atLeast) >= 0))
		.sort(compareVersions)
		.at(-1);
}

export function pickScaffoldVersion(range: string, packument: Packument): string {
	const base = range.replace(/^[\^~>=<\s]+/, "");
	if (!parse(base)) return base;
	const line = lineOf(base);
	const latest = packument.distTags.latest;
	if (latest && onLine(latest, line) && compareVersions(latest, base) >= 0) return latest;
	return newestOnLine(packument, line, base) ?? base;
}

export function pickAddOnVersion(name: string, packument: Packument, policy: VersionPolicy): { version: string; heldBack?: string } {
	const hold = manifest.holdBack[name];
	const line = hold?.major ?? (policy === "verified" ? manifest.verified[name] : undefined);
	const latest = packument.distTags.latest ?? packument.versions.filter((version) => !isPrerelease(version)).sort(compareVersions).at(-1);
	if (!latest) throw new Error(`${name} has no published release`);
	if (!line || onLine(latest, line)) return { version: latest };
	const capped = newestOnLine(packument, line);
	if (!capped) throw new Error(`${name} has no release on the ${line}.x line`);
	return { version: capped, heldBack: hold?.reason };
}

export const fetchPackument: FetchPackument = async (name) => {
	// The abbreviated document (versions and dist-tags only) is a fraction of the full one.
	const response = await fetch(`https://registry.npmjs.org/${name.replace("/", "%2F")}`, {
		headers: { Accept: "application/vnd.npm.install-v1+json" },
	});
	if (!response.ok) throw new Error(`npm registry: ${name} → ${response.status}`);
	const data = (await response.json()) as { "dist-tags": Record<string, string>; versions: Record<string, unknown> };
	return { distTags: data["dist-tags"], versions: Object.keys(data.versions) };
};

// Writes the chosen versions into package.json and returns them, for the version report.
export async function setPackageVersions(
	root: string,
	flags: Set<string>,
	policy: VersionPolicy,
	fetcher: FetchPackument = fetchPackument,
): Promise<ResolvedPackage[]> {
	const path = join(root, "package.json");
	const pkg = JSON.parse(readFileSync(path, "utf8"));
	const scaffold: Record<string, { range: string; dev: boolean }> = {};
	for (const [name, range] of Object.entries<string>(pkg.dependencies ?? {})) scaffold[name] = { range, dev: false };
	for (const [name, range] of Object.entries<string>(pkg.devDependencies ?? {})) scaffold[name] = { range, dev: true };
	const addOns = new Map<string, boolean>();
	for (const group of activeKeys(manifest.packages, flags)) {
		for (const name of group.deps ?? []) addOns.set(name, false);
		for (const name of group.dev ?? []) if (!addOns.has(name)) addOns.set(name, true);
	}

	const names = [...new Set([...Object.keys(scaffold), ...addOns.keys()])];
	const resolved = await Promise.all(
		names.map(async (name): Promise<ResolvedPackage> => {
			const packument = await fetcher(name);
			const fromScaffold = scaffold[name];
			// A scaffold package whose line the kit sets (manifest.scaffoldLines: @types/node follows the Node version the
			// projects require, whatever the scaffolder wrote).
			const line = manifest.scaffoldLines?.[name];
			const range = line ? `^${line}.0.0` : fromScaffold?.range;
			const { version, heldBack } = fromScaffold && range
				? { version: pickScaffoldVersion(range, packument), heldBack: undefined }
				: pickAddOnVersion(name, packument, policy);
			const verified = manifest.verified[name];
			return {
				name,
				version,
				dev: fromScaffold ? fromScaffold.dev : (addOns.get(name) ?? false),
				newerThanVerified: verified !== undefined && compareVersions(version, `${verified}${verified.includes(".") ? ".999999" : ".999999.999999"}`) > 0,
				heldBack,
			};
		}),
	);

	const sorted = (dev: boolean) =>
		Object.fromEntries(resolved.filter((item) => item.dev === dev).sort((a, b) => a.name.localeCompare(b.name)).map((item) => [item.name, `^${item.version}`]));
	writeFileSync(path, `${JSON.stringify({ ...pkg, dependencies: sorted(false), devDependencies: sorted(true) }, null, 2)}\n`);
	return resolved;
}
