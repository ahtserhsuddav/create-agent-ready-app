---
name: new-feature
description: "Adds a new business capability (billing, a waitlist, a blog, team members): scaffolds src/features/<name>/ from the kit's templates and wires it in. Use when a request adds a new area of the product."
---

# New feature

## 1. Scaffold with one command (no hand-written boilerplate)
`{{run}} new:feature <name> --by <agent>`{{#db}} `[--no-db]`{{/db}} `[--content] [--item <singular>]`
- `<name>`: a kebab-case business noun users would recognise: `invoices`, `team-members`, `waitlist`.
{{#db}}
- You get `schema.ts` (Zod){{#hono}}, `server/routes.ts` (Hono, mounted at `/api/<name>`){{/hono}}{{^hono}}, `functions.ts` (server functions){{/hono}}{{#query}}, `hooks/use-<name>.ts`{{/query}},
  `server/service.ts` with a test, and `server/tables.ts`. They're wired in for you (`src/server/db/drizzle/tables.ts`{{#hono}}, `src/server/api/hono/app.ts`{{/hono}}).
{{/db}}
{{^db}}
- You get `content.ts` for the page copy. Data features need the db add-on.
{{/db}}
- The script prints every path it created or wired and creates the task file with Scope filled in. Don't re-read
  the templates; open the created files only where you change them.

## 2. Finish it (the `big-change` steps)
1. Fill the task's Goal and Steps.
2. Replace the example field (`name`) with the real data.{{#db}} Then `{{run}} db:generate`, read the SQL, follow `database-change`.{{/db}}
3. Pages go in `src/routes/` and stay thin: the loader calls the feature{{#query}} (`context.queryClient.ensureQueryData(...)`){{/query}}, the
   component comes from `features/<name>/components/`.
4. Components: one per file (look and feel: skill `website-design`).
5. A public page follows `seo-aeo`; anything that handles input or auth follows `security`.
6. Delete every template piece the feature doesn't use: example fields, unused exports, a replaced test.
   `{{run}} check` fails (Knip) until a page uses the scaffold: that's the zero-dead-code rule at work.
7. Add the feature to PROJECT.md → Features (one line).

## Rules
- One feature is one business capability. Generic pieces with no business logic go in `src/shared/`.
- Import by full path (`#/features/<name>/schema`); UI code never imports a feature's `server/` folder.
- The templates match the kit's verified versions (create-agent-ready-app `manifest.json` → verified). If an
  installed major is newer, compare the generated code with the package's own docs first (skill `official-docs`).
