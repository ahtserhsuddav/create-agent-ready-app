<!-- Written by create-agent-ready-app {{kitVersion}}: this block is the kit's (update: {{run}} kit:update). Project rules go in PROJECT.md. -->
# How every coding agent works in this repo

Claude Code, Codex, Cursor, Copilot, Gemini and other agents read this file. Project facts: `PROJECT.md`.
Skills: `.agents/skills/<name>/SKILL.md`. Load one only when it applies.

## Stack (installed versions: `docs/official/INDEX.md`)
- {{framework}} · Tailwind CSS · {{deploy}} · {{runtime}} with {{pm}} · Biome · Knip · Vitest · Playwright
{{#shadcn}}
- shadcn/ui in `src/shared/components/ui/` (the CLI's files: customize in wrappers, never inside them)
{{/shadcn}}
{{#query}}
- TanStack Query for data in components{{#tanstack-start}} and route loaders{{/tanstack-start}}
{{/query}}
{{#form}}
- TanStack Form with Zod: `useAppForm` from `#/shared/lib/tanstack/form-hook`
{{/form}}
{{#hono}}
- Hono serves `/api/*`; the UI calls it through the typed RPC client `#/shared/api/hono/client`
{{/hono}}
{{#db}}
- Drizzle ORM → {{db}}
{{/db}}
{{#auth}}
- Better Auth (email + password) at `/api/auth/*`
{{/auth}}
{{#email}}
- Email: React Email templates sent with {{emailService}}
{{/email}}
{{#static}}
- Static site: pages are prerendered at build. Need more? `{{dlx}} create-agent-ready-app@latest add <add-on> .`
{{/static}}

## Framework knowledge (newer than your training data: read it, don't guess)
{{#next}}
- Next.js: the bundled docs in `node_modules/next/dist/docs/` (the block Next.js keeps at the top of this file).
  Verify UI changes with skill `next-dev-loop` against the running dev server.
{{/next}}
{{#tanstack-start}}
- TanStack Router and Start ship version-matched skills in their packages: the `intent-skills` block at the top of
  this file says how to list and load them. Load the matching one before changing routes, server functions or SSR.
{{/tanstack-start}}
- Any other library: skill `official-docs` (`{{run}} docs:get <url>`), never memory.

## Commands (use these; never invent others)
| Task | Command |
| --- | --- |
| Install · dev server | `{{install}}` · `{{run}} dev` |
| Production build | `{{run}} build` |
| All checks (end of Big changes only) | `{{run}} check` · auto-fix lint/format: `{{run}} fix` |
| Log a finished request | `{{run}} log "<what changed>" --by <agent>` |
| Start a Big change | `{{run}} task:new "<title>" --by <agent>` |
| New feature skeleton | `{{run}} new:feature <name>` |
| Docs index · fetch one docs page | `{{run}} docs:sync` · `{{run}} docs:get <url>` |
| Design language from awesome-design-md | `{{run}} design:md list` · `{{run}} design:md use <name>` |
{{#db}}
| Migration from table changes | `{{run}} db:generate`, then `{{run}} db:migrate` (local; ask first) |
{{/db}}
{{#shadcn}}
| Add a shadcn/ui component | `{{dlx}} shadcn@latest add <component>` |
{{/shadcn}}

## Pick a lane first
| Lane | When | Do |
| --- | --- | --- |
| **Quick** (default) | ≤ 3 files, no new dependency, nothing Guarded | Say the files in one line, edit, delete what became unused, log. No plan mode, task file, tests, build or checks. |
| **Big** | > 3 files, new behaviour, refactor, upgrade | Skill `big-change` (new capability: `new-feature`). |
| **Guarded** | DB schema or data, auth, payments, secrets/env, dependencies, build/deploy/CI config, deleting files or features, anything remote | Big lane + one yes/no question before the risky step. |

A Quick change that needs a 4th file or touches a Guarded area switches lane: say so in one line. A bug with an
obvious cause is a Quick fix; a hard or unclear one goes to skill `diagnosing-bugs` first.

## Always
1. Change only what was asked, inside your scope. No drive-by refactors, renames or reformatting.
2. Zero dead code: delete every import, variable, function, type, prop, style, asset, test and file your change made unused. No commented-out code, no `old`/`v2` copies, no compatibility shims unless asked. `rg` the old names before you finish.
3. Structure (skill `project-structure` before creating, moving or naming files): `category/vendor/role-file.ts`, kebab-case, `#/` imports, no barrel files.
   - {{#tanstack-start}}`src/routes/`{{/tanstack-start}}{{#next}}`src/app/`{{/next}} URL → page, thin · `src/features/<name>/` one capability (`components/` `hooks/` `schema.ts`{{#server}} {{#tanstack-start}}`functions.ts`{{/tanstack-start}}{{#next}}`actions.ts`{{/next}} `server/`{{/server}})
   - `src/shared/` generic UI and helpers, never imports features{{#server}} · `src/server/` infrastructure; UI code never imports server code{{/server}}
   - SVGs: drop the file in `src/shared/assets/icons/` and import it as a component (skill `project-structure`). Never hand-write SVG components.
4. Design: a new page, redesign or visual direction starts with skill `website-design`. No page code until `design/DESIGN.md` → Design inputs is filled (references → awesome-design-md base → taste-skill → reference sites).
5. Read little: find with `rg`, read only the lines you need, never re-read a file you just edited. Don't open `{{lockfile}}`, generated files{{#tanstack-start}} (`src/routeTree.gen.ts`){{/tanstack-start}}, build output or all of `CHANGELOG.md` (`tail` it).
6. Replies: 5 lines or fewer. What changed, where, anything the human must do.
7. Finished a request that changed files? One line: `{{run}} log "<what>" --by <agent>`.
8. Ask before anything outside the code (git commit/push, database writes beyond local, provider dashboards, deploys) with one short yes/no question: what runs, where, how to undo. Committing when asked: skill `git-commit`.

## Never
- Read, write or print `.env*`, `.dev.vars*` or any secret value. `.env.example` lists the names; the human fills `.env`.
- Run `rm -rf`, `git reset --hard`, `git clean` or `git push --force`.
- Edit generated files: {{#tanstack-start}}`routeTree.gen.ts`, {{/tanstack-start}}`.agents/skills/` copies of community skills{{#shadcn}}, `src/shared/components/ui/*`{{/shadcn}}{{#db}}, applied migrations{{/db}}{{#auth}}, `src/server/auth/better-auth/tables.ts`{{/auth}}.
- Add, upgrade or remove a dependency without asking.
- Invent APIs, env vars, file paths, design tokens or config keys.

## Skills
This project's own: `big-change` · `new-feature` · `project-structure` · `official-docs` · `website-design`{{#seo}} · `seo-aeo`{{/seo}} · `security`{{#db}} · `database-change`{{/db}} · `release` · `project-setup`.

From their makers, in `.agents/skills/` (refresh: `{{run}} skills:update`; a weekly pull request does it too):
{{communitySkills}}

An agent made the same mistake twice? Add one line to `PROJECT.md` → "Rules for agents".
