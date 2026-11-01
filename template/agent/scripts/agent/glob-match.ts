// Matches repo paths against the globs in a task's Scope: `*` within one folder, `**` across folders, `?` one character.
export function globToRegExp(glob: string): RegExp {
	let pattern = "";
	for (let index = 0; index < glob.length; index++) {
		const char = glob[index] as string;
		if (char === "*" && glob[index + 1] === "*") {
			const slashAfter = glob[index + 2] === "/";
			pattern += slashAfter ? "(?:.*/)?" : ".*";
			index += slashAfter ? 2 : 1;
		} else if (char === "*") pattern += "[^/]*";
		else if (char === "?") pattern += "[^/]";
		else pattern += char.replace(/[.+^${}()|[\]\\]/g, "\\$&");
	}
	// "src/features/billing/" or a bare folder name also covers everything inside it.
	return new RegExp(`^${pattern}${glob.endsWith("/") ? ".*" : "(?:/.*)?"}$`);
}

export const matchesAny = (path: string, globs: string[]) => globs.some((glob) => globToRegExp(glob).test(path));
