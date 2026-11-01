// How each package manager spells the same commands. Templates use these as {{run}}, {{exec}}, {{dlx}}… and the
// create pipeline spawns them, so bun, pnpm and npm projects all get commands that work for them.
export type PackageManager = "bun" | "pnpm" | "npm";

type Commands = {
	run: string; // a package.json script: `{{run}} dev`. pnpm needs `run`: its built-in `pnpm deploy` would win.
	exec: string; // a binary from node_modules
	dlx: string; // a package's binary, fetched for one run
	install: string;
	installFrozen: string;
	add: string;
	addDev: string;
	audit: string;
	outdated: string;
	lockfile: string;
};

export const packageManagers: Record<PackageManager, Commands> = {
	bun: {
		run: "bun run",
		exec: "bunx",
		dlx: "bunx",
		install: "bun install",
		installFrozen: "bun install --frozen-lockfile",
		add: "bun add",
		addDev: "bun add -d",
		audit: "bun audit",
		outdated: "bun outdated",
		lockfile: "bun.lock",
	},
	pnpm: {
		run: "pnpm run",
		exec: "pnpm exec",
		dlx: "pnpm dlx",
		install: "pnpm install",
		installFrozen: "pnpm install --frozen-lockfile",
		add: "pnpm add",
		addDev: "pnpm add -D",
		audit: "pnpm audit",
		outdated: "pnpm outdated",
		lockfile: "pnpm-lock.yaml",
	},
	npm: {
		run: "npm run",
		exec: "npx",
		dlx: "npx -y",
		install: "npm install",
		installFrozen: "npm ci",
		add: "npm install",
		addDev: "npm install -D",
		audit: "npm audit",
		outdated: "npm outdated",
		lockfile: "package-lock.json",
	},
};

// The argv to run a package's binary once, e.g. ["bunx", "shadcn@latest", "add", …].
export function dlxArgs(pm: PackageManager, pkg: string, args: string[]): string[] {
	return [...packageManagers[pm].dlx.split(" "), pkg, ...args];
}

// The argv to run a binary installed in the project, e.g. ["pnpm", "exec", "drizzle-kit", "generate"].
export function execArgs(pm: PackageManager, bin: string, args: string[]): string[] {
	return [...packageManagers[pm].exec.split(" "), bin, ...args];
}
