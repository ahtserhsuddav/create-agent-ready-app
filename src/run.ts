// Runs commands. run() waits (short commands); runStreaming() hands over each output line as it arrives, so a spinner
// or log keeps moving; runAttached() gives the command the terminal, so its own progress bars show. All use Node's
// child_process, so the CLI works the same under Node and Bun.
import { spawn, spawnSync } from "node:child_process";

export type RunResult = { code: number; out: string };

// Keeps third-party tools from phoning home while the kit runs them.
const quietEnv = (extra?: Record<string, string>) => ({
	...process.env,
	DO_NOT_TRACK: "1",
	DISABLE_TELEMETRY: "1",
	NEXT_TELEMETRY_DISABLED: "1",
	...extra,
});
// Windows resolves npx, pnpm and bunx shims only through a shell.
const shell = process.platform === "win32";

export function run(command: string, args: string[], cwd: string, options: { env?: Record<string, string> } = {}): RunResult {
	const result = spawnSync(command, args, { cwd, encoding: "utf8", stdio: "pipe", env: quietEnv(options.env), shell });
	const out = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
	return { code: result.status ?? 1, out: result.error ? `${out}\n${result.error.message}`.trim() : out };
}

// stdout and stderr line by line (progress redraws with \r count as lines too), plus everything at the end.
export function runStreaming(
	command: string,
	args: string[],
	cwd: string,
	onLine: (line: string) => void,
	options: { env?: Record<string, string> } = {},
): Promise<RunResult> {
	return new Promise((resolve) => {
		const child = spawn(command, args, { cwd, env: quietEnv({ FORCE_COLOR: "0", ...options.env }), shell });
		let out = "";
		let pending = "";
		const take = (chunk: Buffer) => {
			const text = chunk.toString();
			out += text;
			const parts = (pending + text).split(/\r?\n|\r/);
			pending = parts.pop() ?? "";
			for (const part of parts) {
				const line = stripAnsi(part).trimEnd();
				if (line.trim()) onLine(line);
			}
		};
		child.stdout.on("data", take);
		child.stderr.on("data", take);
		child.on("error", (error) => resolve({ code: 1, out: `${out}\n${error.message}`.trim() }));
		child.on("close", (code) => {
			const last = stripAnsi(pending).trimEnd();
			if (last.trim()) onLine(last);
			resolve({ code: code ?? 1, out: out.trim() });
		});
	});
}

// The command writes straight to the terminal (installs show the package manager's own progress). Exit code only.
export function runAttached(command: string, args: string[], cwd: string, options: { env?: Record<string, string> } = {}): Promise<number> {
	return new Promise((resolve) => {
		const child = spawn(command, args, { cwd, env: quietEnv(options.env), stdio: "inherit", shell });
		child.on("error", () => resolve(1));
		child.on("close", (code) => resolve(code ?? 1));
	});
}

// biome-ignore lint/suspicious/noControlCharactersInRegex: matching terminal escape codes is the point.
export const stripAnsi = (text: string) => text.replace(/\u001b\[[0-9;?]*[ -/]*[@-~]|\u001b\][^\u0007]*\u0007/g, "");

// The last useful line of a failed command's output, for one-line error messages.
export const lastLine = (out: string) =>
	stripAnsi(out)
		.split("\n")
		.filter((line) => line.trim())
		.at(-1) ?? "unknown error";
