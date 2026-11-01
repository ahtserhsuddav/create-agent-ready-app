import { describe, expect, test } from "bun:test";
import { renderTemplate } from "../../src/render-template";

const flags = new Set(["core", "db", "supabase"]);

describe("renderTemplate", () => {
	test("keeps blocks whose flag is on and drops the rest", () => {
		const text = ["a", "{{#db}}", "db line", "{{/db}}", "// {{#auth}}", "auth line", "// {{/auth}}", "z"].join("\n");
		expect(renderTemplate(text, flags, {})).toBe(["a", "db line", "z"].join("\n"));
	});

	test("{{^flag}} keeps a block only when the flag is off", () => {
		const text = ["{{^auth}}", "no auth", "{{/auth}}", "# {{^db}}", "no db", "# {{/db}}"].join("\n");
		expect(renderTemplate(text, flags, {})).toBe("no auth");
	});

	test("nested blocks need every parent to be visible", () => {
		const text = ["{{#auth}}", "{{#db}}", "hidden", "{{/db}}", "{{/auth}}", "{{#db}}", "{{#supabase}}", "shown", "{{/supabase}}", "{{/db}}"].join("\n");
		expect(renderTemplate(text, flags, {})).toBe("shown");
	});

	test("inline blocks and variables on one line", () => {
		expect(renderTemplate("Stack: Start{{#db}} + {{db}}{{/db}}{{#auth}} + auth{{/auth}}", flags, { db: "Supabase" })).toBe(
			"Stack: Start + Supabase",
		);
		expect(renderTemplate("keep {{unknown}} as is", flags, {})).toBe("keep {{unknown}} as is");
	});

	test("rejects broken blocks instead of leaking markers", () => {
		expect(() => renderTemplate("{{#db}}\nnever closed", flags, {})).toThrow("never closed");
		expect(() => renderTemplate("{{#db}}\nx\n{{/auth}}", flags, {})).toThrow("closes");
		expect(() => renderTemplate("start{{#db}} spans\nlines{{/db}}", flags, {})).toThrow("same line");
	});
});
