// The create pipeline's terminal UI: numbered steps, command output that streams in a small window and folds away on
// success (staying in full on failure), the package manager's own install output, a progress bar, and plain lines
// when the output isn't a terminal (CI, pipes).
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import * as p from "@clack/prompts";

export type StepResult = { ok: boolean; detail?: string };

const seconds = (start: number) => `${((Date.now() - start) / 1000).toFixed(1)}s`;

export class Progress {
	private current = 0;
	private readonly lines: string[] = [];
	readonly live: boolean;

	constructor(
		private readonly total: number,
		live = Boolean(process.stdout.isTTY),
	) {
		this.live = live;
	}

	private counter() {
		this.current += 1;
		return `Step ${this.current}/${this.total} ·`;
	}

	private record(line: string) {
		this.lines.push(line);
	}

	// A command whose output streams in a short window, then folds into one ✓ line (or stays, in full, on failure).
	async stream(label: string, work: (line: (text: string) => void) => Promise<StepResult>): Promise<StepResult> {
		const title = `${this.counter()} ${label}`;
		const start = Date.now();
		this.record(`## ${title}`);
		if (!this.live) {
			console.log(`▸ ${title}`);
			const captured: string[] = [];
			const result = await work((text) => {
				captured.push(text);
				this.record(text);
			});
			console.log(result.ok ? `  ✓ ${label} (${seconds(start)})` : `  ✗ ${label}: ${result.detail ?? ""}\n${captured.slice(-30).join("\n")}`);
			return result;
		}
		const log = p.taskLog({ title, limit: 6, retainLog: true });
		const result = await work((text) => {
			this.record(text);
			log.message(text);
		});
		if (result.ok) log.success(`${label} · ${seconds(start)}`);
		else log.error(`${label} failed${result.detail ? `: ${result.detail}` : ""}`, { showLog: true });
		return result;
	}

	// A command that owns the terminal (installs: the package manager's own live output), after a short intro.
	async attached(label: string, intro: string[], work: () => Promise<number>, done: string): Promise<StepResult> {
		const title = `${this.counter()} ${label}`;
		const start = Date.now();
		this.record(`## ${title}`);
		if (this.live) p.log.step(`${title}\n${intro.join("\n")}`);
		else console.log(`▸ ${title}\n${intro.map((line) => `  ${line}`).join("\n")}`);
		const code = await work();
		const ok = code === 0;
		const message = ok ? `${done} in ${seconds(start)}` : `${label} failed (exit code ${code})`;
		if (this.live) (ok ? p.log.success : p.log.error)(message);
		else console.log(`  ${ok ? "✓" : "✗"} ${message}`);
		return { ok, detail: ok ? undefined : `exit code ${code}` };
	}

	// Work with a known number of parts (skill sources): a progress bar that advances per part.
	async bar<T>(label: string, parts: number, work: (advance: (message: string) => void) => Promise<T>, done: (result: T) => string) {
		const title = `${this.counter()} ${label}`;
		this.record(`## ${title}`);
		const start = Date.now();
		if (!this.live) {
			console.log(`▸ ${title}`);
			const result = await work((message) => {
				this.record(message);
				console.log(`  · ${message}`);
			});
			console.log(`  ✓ ${done(result)} (${seconds(start)})`);
			return result;
		}
		const bar = p.progress({ max: Math.max(parts, 1), style: "heavy" });
		bar.start(title);
		let index = 0;
		const result = await work((message) => {
			index += 1;
			this.record(message);
			bar.advance(1, `${label} ${index}/${parts} · ${message}`);
		});
		bar.stop(`${done(result)} · ${seconds(start)}`);
		return result;
	}

	// A quick step with a spinner (and elapsed time).
	async spin<T>(label: string, work: () => T | Promise<T>, done?: (result: T) => string): Promise<T> {
		const title = `${this.counter()} ${label}`;
		this.record(`## ${title}`);
		const start = Date.now();
		if (!this.live) {
			console.log(`▸ ${title}`);
			const result = await work();
			console.log(`  ✓ ${done ? done(result) : label} (${seconds(start)})`);
			return result;
		}
		const spinner = p.spinner({ indicator: "timer" });
		spinner.start(title);
		try {
			const result = await work();
			spinner.stop(done ? done(result) : label);
			return result;
		} catch (error) {
			spinner.error(`${label} failed`);
			throw error;
		}
	}

	// One spinner per item, each ending ✓ or ✗; stops at the first failure and shows its output.
	async checks(label: string, items: { name: string; run: () => Promise<StepResult & { out?: string }> }[]): Promise<boolean> {
		const title = `${this.counter()} ${label}`;
		this.record(`## ${title}`);
		if (this.live) p.log.step(title);
		else console.log(`▸ ${title}`);
		for (const item of items) {
			const start = Date.now();
			const spinner = this.live ? p.spinner({ indicator: "timer" }) : undefined;
			spinner?.start(item.name);
			const result = await item.run();
			if (result.out) this.record(result.out);
			if (result.ok) {
				if (spinner) spinner.stop(`${item.name} · ${seconds(start)}`);
				else console.log(`  ✓ ${item.name} (${seconds(start)})`);
				continue;
			}
			const tail = (result.out ?? "").split("\n").slice(-25).join("\n");
			if (spinner) {
				spinner.error(`${item.name} failed`);
				p.log.error(tail);
			} else console.log(`  ✗ ${item.name}\n${tail}`);
			return false;
		}
		return true;
	}

	warn(message: string) {
		this.record(`warning: ${message}`);
		if (this.live) p.log.warn(message);
		else console.log(`  ! ${message}`);
	}

	info(message: string) {
		if (this.live) p.log.info(message);
		else console.log(`  ${message}`);
	}

	// Everything that ran, for the log file a failure points to.
	saveLog(path: string) {
		mkdirSync(dirname(path), { recursive: true });
		writeFileSync(path, `${this.lines.join("\n")}\n`);
	}
}
