// Turns command-line flags and prompt answers into a project's choices. Only what the user picked is ever set up:
// a missing requirement (Better Auth needs a database…) is reported, never added silently.
import {
	activeSkillPacks,
	type Choices,
	type Database,
	type Deploy,
	type EmailProvider,
	manifest,
	type Runtime,
} from "../kit-config";
import type { PackageManager } from "../package-manager";

export type ChoiceFlags = {
	framework?: string;
	runtime?: string;
	pm?: string;
	addOns?: string;
	preset?: string;
	skills?: string;
	design?: string;
};

// An add-on or database that needs something the user didn't pick.
export type Requirement = { item: string; label: string; needs: string; needsLabel: string };

// The ids users pick in the add-ons step (and pass to --add-ons / --skills): a feature add-on, a database, an email
// service, a deploy target or an optional skill pack.
export type PickKind = "addOn" | "db" | "email" | "deploy" | "skills";

export function kindOf(id: string): PickKind | undefined {
	if (id in manifest.databases) return "db";
	if (id in manifest.emailProviders) return "email";
	if (id in manifest.deploys) return "deploy";
	if (manifest.skillPacks[id]?.optional) return "skills";
	if (id in manifest.addOns && id !== "db" && id !== "email") return "addOn";
	return undefined;
}

type Labelled = { label: string; hint?: string };
function entryOf(id: string): Labelled | undefined {
	switch (kindOf(id)) {
		case "db":
			return manifest.databases[id as Database];
		case "email":
			return manifest.emailProviders[id as EmailProvider];
		case "deploy":
			return manifest.deploys[id as Deploy];
		case "skills":
			return manifest.skillPacks[id];
		case "addOn":
			return manifest.addOns[id];
		default:
			return undefined;
	}
}
export const labelOf = (id: string) => entryOf(id)?.label ?? id;
export const hintOf = (id: string) => entryOf(id)?.hint;

// Ids a framework can pick: everything in the add-on groups except skill packs made for another framework.
export function availableIds(framework: string): string[] {
	return manifest.addOnGroups
		.flatMap((group) => group.items)
		.filter((id) => !manifest.skillPacks[id]?.frameworks || manifest.skillPacks[id]?.frameworks?.includes(framework));
}

// "none" (or an empty value) is an explicit empty list; a missing flag is undefined.
const list = (value: string | undefined) =>
	value === undefined ? undefined : value.split(",").map((item) => item.trim()).filter((item) => item && item !== "none");

// The package manager that ran us (`pnpm create …` sets npm_config_user_agent to "pnpm/…"), npm otherwise.
export function detectPackageManager(userAgent = process.env.npm_config_user_agent ?? ""): PackageManager {
	if (userAgent.startsWith("bun")) return "bun";
	if (userAgent.startsWith("pnpm")) return "pnpm";
	return "npm";
}

export const defaultIds = () => ["seo"];
const defaultDeploy = () => Object.keys(manifest.deploys)[0] as Deploy;

// Picked ids → the choices the templates read. No deploy target picked means the first one (Node server).
export function applyIds(base: Pick<Choices, "framework" | "runtime" | "pm" | "design">, ids: string[]): Choices {
	const addOns: string[] = [];
	const skills: string[] = [];
	let db: Database | undefined;
	let email: EmailProvider | undefined;
	let deploy = defaultDeploy();
	for (const id of ids) {
		const kind = kindOf(id);
		if (kind === "addOn") addOns.push(id);
		else if (kind === "db") {
			addOns.push("db");
			db = id as Database;
		} else if (kind === "email") {
			addOns.push("email");
			email = id as EmailProvider;
		} else if (kind === "deploy") deploy = id as Deploy;
		else if (kind === "skills") skills.push(id);
	}
	return { ...base, deploy, addOns: orderAddOns(addOns), db, email, skills: orderSkills(skills) };
}

// The inverse of applyIds, for initial prompt values and the summary.
export function idsOf(choices: Choices): string[] {
	const ids = choices.addOns.filter((name) => name !== "db" && name !== "email");
	if (choices.db) ids.push(choices.db);
	if (choices.email) ids.push(choices.email);
	ids.push(choices.deploy, ...choices.skills);
	return ids;
}

export function orderAddOns(addOns: string[]): string[] {
	return Object.keys(manifest.addOns).filter((name) => addOns.includes(name));
}

const orderSkills = (skills: string[]) => Object.keys(manifest.skillPacks).filter((id) => skills.includes(id));

// Problems with a set of picked ids: unknown ids, ids another framework owns, two picks in a pick-one group.
export function idProblems(ids: string[], framework: string): string[] {
	const problems: string[] = [];
	const available = availableIds(framework);
	for (const id of ids) {
		if (!kindOf(id)) problems.push(`"${id}" is not one of: ${available.join(", ")}`);
		else if (!available.includes(id)) problems.push(`${labelOf(id)} is not available for ${manifest.frameworks[framework]?.label ?? framework}`);
	}
	for (const group of manifest.addOnGroups.filter((entry) => entry.pickOne)) {
		const picked = group.items.filter((id) => ids.includes(id));
		if (picked.length > 1) problems.push(`Pick one ${group.label.toLowerCase()}, not ${picked.map(labelOf).join(" and ")}`);
	}
	return problems;
}

// Fills every choice from flags, the preset and defaults. Throws on anything unknown or inconsistent.
export function choicesFromFlags(flags: ChoiceFlags, detected: PackageManager = detectPackageManager()): Choices {
	const framework = flags.framework ?? Object.keys(manifest.frameworks)[0] ?? "tanstack-start";
	if (!manifest.frameworks[framework]) throw new Error(`--framework must be one of: ${Object.keys(manifest.frameworks).join(", ")}`);
	const pm = (flags.pm ?? (flags.runtime === "node" && detected === "bun" ? "npm" : flags.runtime === "bun" ? "bun" : detected)) as PackageManager;
	const runtime = (flags.runtime ?? (pm === "bun" ? "bun" : "node")) as Runtime;
	if (flags.preset && !manifest.presets[flags.preset]) {
		throw new Error(`--preset must be one of: ${Object.keys(manifest.presets).join(", ")}`);
	}
	const ids = [...(list(flags.addOns) ?? (flags.preset ? manifest.presets[flags.preset] : defaultIds()) ?? []), ...(list(flags.skills) ?? [])];
	const problems = idProblems(ids, framework);
	if (problems.length) throw new Error(problems.join("\n"));
	const design = flags.design && flags.design !== "none" ? flags.design : undefined;
	const choices = applyIds({ framework, runtime, pm, design }, ids);
	validateChoices(choices);
	return choices;
}

export function validateChoices(choices: Choices) {
	const problems: string[] = [];
	const oneOf = (what: string, value: string | undefined, allowed: string[]) => {
		if (value !== undefined && !allowed.includes(value)) problems.push(`${what} "${value}" is not one of: ${allowed.join(", ")}`);
	};
	oneOf("--framework", choices.framework, Object.keys(manifest.frameworks));
	oneOf("--runtime", choices.runtime, Object.keys(manifest.runtimes));
	oneOf("deploy target", choices.deploy, Object.keys(manifest.deploys));
	oneOf("database", choices.db, Object.keys(manifest.databases));
	oneOf("email service", choices.email, Object.keys(manifest.emailProviders));
	for (const addOn of choices.addOns) oneOf("add-on", addOn, Object.keys(manifest.addOns));
	const pms = manifest.runtimes[choices.runtime]?.pms ?? [];
	if (!pms.includes(choices.pm)) problems.push(`--runtime ${choices.runtime} works with --pm ${pms.join(" or ")}, not ${choices.pm}`);
	if (choices.addOns.includes("db") && !choices.db) problems.push("the database add-on needs a database");
	if (choices.addOns.includes("email") && !choices.email) problems.push("the email add-on needs an email service");
	if (problems.length) throw new Error(problems.join("\n"));
}

export function findMissingRequirements(choices: Choices): Requirement[] {
	const missing: Requirement[] = [];
	for (const addOn of choices.addOns) {
		for (const needs of manifest.addOns[addOn]?.requires ?? []) {
			if (choices.addOns.includes(needs)) continue;
			const pick = needs === "db" ? "postgres" : needs;
			missing.push({ item: addOn, label: manifest.addOns[addOn]?.label ?? addOn, needs: pick, needsLabel: `a database (${labelOf(pick)})` });
		}
	}
	const deploys = choices.db ? manifest.databases[choices.db]?.deploys : undefined;
	if (choices.db && deploys && !deploys.includes(choices.deploy)) {
		const needs = deploys[0] ?? "cloudflare";
		missing.push({ item: choices.db, label: labelOf(choices.db), needs, needsLabel: labelOf(needs) });
	}
	return missing;
}

// Applies the user's answer to one requirement: add what it needs, or drop the item that needs it.
export function resolveRequirement(choices: Choices, requirement: Requirement, add: boolean): Choices {
	const ids = idsOf(choices);
	if (add) {
		const kind = kindOf(requirement.needs);
		const kept = ids.filter((id) => kindOf(id) !== kind || kind === "addOn" || kind === "skills");
		return applyIds(choices, [...kept, requirement.needs]);
	}
	return applyIds(choices, ids.filter((id) => id !== requirement.item));
}

// "17 skills from 9 sources": what the skills step will install for these choices.
export function skillCount(choices: Choices): { skills: number; sources: number } {
	const sources = activeSkillPacks(choices).flatMap(([, pack]) => pack.sources);
	return { skills: new Set(sources.flatMap((source) => source.skills)).size, sources: new Set(sources.map((source) => source.repo)).size };
}

// One line per choice, for the summary before anything is created.
export function describeChoices(choices: Choices): string[] {
	const addOns = choices.addOns.filter((name) => name !== "db" && name !== "email").map(labelOf);
	const { skills, sources } = skillCount(choices);
	const optional = choices.skills.map(labelOf);
	return [
		`Framework    ${manifest.frameworks[choices.framework]?.label ?? choices.framework}`,
		`Runtime      ${manifest.runtimes[choices.runtime]?.label ?? choices.runtime} · ${choices.pm}`,
		`Deploy       ${labelOf(choices.deploy)}`,
		`Add-ons      ${addOns.join(", ") || "none"}`,
		...(choices.db ? [`Database     ${labelOf(choices.db)}`] : []),
		...(choices.email ? [`Email        ${labelOf(choices.email)}`] : []),
		`Agent skills ${skills} from ${sources} sources${optional.length ? ` (with ${optional.join(", ")})` : ""}`,
		...(choices.design ? [`Design       ${choices.design} (awesome-design-md)`] : []),
	];
}
