---
name: big-change
description: "Big or Guarded changes: more than 3 files, new behaviour, refactors, upgrades, or anything touching the database, auth, payments, secrets, dependencies or config. Tiny task file, one check at the end."
---

# Big change

Keep the paperwork tiny and spend the effort on the change itself.

## 1. Start with one command
`{{run}} task:new "<short title>" --by <agent>` creates `tasks/<date>-<slug>.md`. Fill it in, 15 lines at most:
- **Goal:** one line, in the human's words.
- **Scope:** the paths or globs you may change, one per line (`src/features/billing/**`). Only these.
- **Steps:** 3–7 checkboxes. No essays and no plan mode.

## 2. Guarded? Ask once
A step that touches the database schema or data, auth, payments, secrets or env, dependencies, vite/wrangler/CI
config, deletes files outside Scope, or runs anything remote: ask one yes/no question that lists those steps (what
runs, where, how to undo). After a yes, do the listed steps without asking again.

## 3. Work
- Look up every library API in the official docs first (skill `official-docs`). New files follow `project-structure`.
- Need a file outside Scope? Add it to Scope plus one Log line saying why. Guarded areas still need the yes.
- Write tests for new or changed logic (services, schemas, pure helpers) next to the file as `<file>.test.ts`.
  No tests for copy or styling.
- While working, run only the related test: `{{run}} test <path>`. Don't run the whole suite, the build or the dev
  server after every step.
- Tick steps off as you finish them. Log only decisions and surprises: `- <date> <one line>`.

## 4. Clean up: no dead code
For everything you replaced, renamed or removed, `rg` the old names, imports, CSS classes and asset paths, and
delete whatever nothing uses any more, including whole files. No commented-out code, no `old`/`legacy` copies.

## 5. Finish
1. `{{run}} check` once: typecheck, lint, unused code, tests, scope. Fix what fails (`{{run}} fix` handles
   formatting). Never weaken a rule, test or type to make it pass.
2. A fact in PROJECT.md changed (feature list, decision, environment)? Update that one line.
3. Set `Status: done` in the task file, then `{{run}} log "<what changed>" --by <agent> --task <task file>`.
4. Reply in 5 lines or fewer: what changed, how to see it, anything the human must do (and the commit question).

## Handing over
Stopping before it's done? Leave the unticked steps plus one Log line saying where you stopped. The next agent
starts from the task file, not from the chat.
