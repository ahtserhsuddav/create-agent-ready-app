// The interactive questions of `create`: framework, runtime and package manager, the add-ons in labelled groups (stack
// pieces and optional skill packs), one question per missing requirement, a design language, then a summary.
import * as p from "@clack/prompts";
import { listDesigns } from "../design-md";
import { type Choices, manifest, type Runtime } from "../kit-config";
import type { PackageManager } from "../package-manager";
import {
	applyIds,
	availableIds,
	type ChoiceFlags,
	defaultIds,
	describeChoices,
	findMissingRequirements,
	hintOf,
	idProblems,
	labelOf,
	resolveRequirement,
	validateChoices,
} from "./choices";

export type Answers = { name: string; choices: Choices; git: boolean };

function answer<T>(value: T): Exclude<T, symbol> {
	if (p.isCancel(value)) {
		p.cancel("Cancelled: nothing was created.");
		process.exit(0);
	}
	return value as Exclude<T, symbol>;
}

const options = <Key extends string>(map: Record<Key, { label: string; hint?: string }>, keys = Object.keys(map) as Key[]) =>
	keys.map((value) => ({ value, label: map[value].label, hint: map[value].hint }));

export const validProjectName = (name: string) => /^[a-z0-9][a-z0-9._-]*$/.test(name);

const list = (value: string | undefined) => value?.split(",").map((item) => item.trim()).filter((item) => item && item !== "none");

// Flags already given are used as they are; everything else is asked.
export async function askChoices(given: { name?: string; flags: ChoiceFlags; git?: boolean }, detectedPm: PackageManager): Promise<Answers> {
	const { flags } = given;
	const name =
		given.name ??
		answer(
			await p.text({
				message: "Project name",
				placeholder: "my-app",
				defaultValue: "my-app",
				validate: (value) => (!value || validProjectName(value) ? undefined : "Lowercase letters, numbers, dots, dashes"),
			}),
		);

	const frameworks = Object.keys(manifest.frameworks);
	const framework =
		flags.framework ??
		(frameworks.length === 1
			? (frameworks[0] as string)
			: answer(await p.select({ message: "Framework", options: options(manifest.frameworks), initialValue: frameworks[0] })));

	const runtime = (flags.runtime ??
		(flags.pm ? (flags.pm === "bun" ? "bun" : "node") : undefined) ??
		answer(
			await p.select({
				message: `Runtime (you ran this with ${detectedPm})`,
				options: options(manifest.runtimes),
				initialValue: detectedPm === "bun" ? "bun" : "node",
			}),
		)) as Runtime;

	const pms = manifest.runtimes[runtime].pms;
	const pm = (flags.pm ??
		(pms.length === 1
			? pms[0]
			: answer(
					await p.select({
						message: "Package manager",
						options: pms.map((value) => ({ value, label: value })),
						initialValue: pms.includes(detectedPm) ? detectedPm : pms[0],
					}),
				))) as PackageManager;

	const givenIds = list(flags.addOns) ?? (flags.preset ? manifest.presets[flags.preset] : undefined);
	const ids = [...(givenIds ?? (await askAddOns(framework))), ...(list(flags.skills) ?? [])];
	const problems = idProblems(ids, framework);
	if (problems.length) throw new Error(problems.join("\n"));

	let choices = applyIds({ framework, runtime, pm }, ids);
	for (let missing = findMissingRequirements(choices); missing.length; missing = findMissingRequirements(choices)) {
		const requirement = missing[0];
		if (!requirement) break;
		const add = answer(
			await p.select({
				message: `${requirement.label} needs ${requirement.needsLabel}.`,
				options: [
					{ value: true, label: `Add ${requirement.needsLabel}` },
					{ value: false, label: `Drop ${requirement.label}` },
				],
			}),
		);
		choices = resolveRequirement(choices, requirement, add);
	}
	choices.design = flags.design !== undefined ? (flags.design === "none" ? undefined : flags.design) : await askDesign();
	validateChoices(choices);

	const git = given.git ?? answer(await p.confirm({ message: "Initialize a git repository?", initialValue: true }));

	p.note(describeChoices(choices).join("\n"), name);
	if (!answer(await p.confirm({ message: "Create the project?", initialValue: true }))) {
		p.cancel("Cancelled: nothing was created.");
		process.exit(0);
	}
	return { name, choices, git };
}

// One screen with every add-on, grouped under labels. Pick-one groups are checked after the answer (clack's grouped
// list has no per-group limit), and the question comes back with the same picks until they fit.
async function askAddOns(framework: string): Promise<string[]> {
	const available = availableIds(framework);
	const groups: Record<string, { value: string; label: string; hint?: string }[]> = {};
	for (const group of manifest.addOnGroups) {
		const items = group.items.filter((id) => available.includes(id));
		if (!items.length) continue;
		const title = group.pickOne ? `${group.label} (pick one)` : group.label;
		groups[title] = items.map((id) => ({ value: id, label: labelOf(id), hint: hintOf(id) }));
	}
	let picked = defaultIds();
	for (;;) {
		picked = answer(
			await p.groupMultiselect({
				message: "Add-ons (space to toggle, enter to confirm). Only what you check is set up; no deploy target means Node server.",
				options: groups,
				initialValues: picked,
				required: false,
				selectableGroups: false,
			}),
		);
		const problems = idProblems(picked, framework);
		if (!problems.length) return picked;
		p.log.error(problems.join("\n"));
	}
}

// "Decide later" keeps the kit's empty DESIGN.md; otherwise one entry of the awesome-design-md catalog.
async function askDesign(): Promise<string | undefined> {
	const how = answer(
		await p.select({
			message: "Design language",
			options: [
				{ value: "later", label: "Decide later", hint: "the website-design skill helps you write design/DESIGN.md" },
				{ value: "pick", label: "Start from a known design language", hint: "awesome-design-md: Linear, Stripe, Vercel, Notion…" },
			],
			initialValue: "later",
		}),
	);
	if (how === "later") return undefined;
	const spinner = p.spinner();
	spinner.start("Fetching the awesome-design-md catalog");
	try {
		const entries = await listDesigns();
		spinner.stop(`${entries.length} design languages`);
		return answer(
			await p.autocomplete({
				message: "Design language (type to search)",
				options: entries.map((entry) => ({ value: entry.name, label: entry.label, hint: entry.description })),
				placeholder: "linear.app, stripe, vercel…",
				maxItems: 10,
			}),
		);
	} catch (error) {
		spinner.error(`Couldn't fetch the catalog (${(error as Error).message}): deciding later`);
		return undefined;
	}
}
