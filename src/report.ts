// Collects what a create, install, update, add or remove did, and prints it in a few lines.
export type Report = {
	created: string[];
	updated: string[];
	removed: string[];
	skipped: string[];
	moved: string[];
	notes: string[];
};

export const createReport = (): Report => ({ created: [], updated: [], removed: [], skipped: [], moved: [], notes: [] });

export function printReport(report: Report, dryRun: boolean) {
	const prefix = dryRun ? "would be " : "";
	const sections: [string, string[]][] = [
		[`${prefix}created`, report.created],
		[`${prefix}updated`, report.updated],
		[`${prefix}removed`, report.removed],
		[`${prefix}moved to docs/legacy-agents.md`, report.moved],
		["skipped", report.skipped],
	];
	for (const [label, items] of sections) {
		if (items.length) console.log(`${label} (${items.length}):\n${items.map((item) => `  ${item}`).join("\n")}`);
	}
	if (!sections.some(([, items]) => items.length)) console.log("Nothing to change: the project matches the kit.");
	for (const note of report.notes) console.log(`→ ${note}`);
}
