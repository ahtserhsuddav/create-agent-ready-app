# Contributing

Thanks for helping. Bugs and add-on requests go in issues (the forms ask for what's needed). Security problems go
through [SECURITY.md](SECURITY.md), never a public issue.

## Setup
`bun install`, then `bun run typecheck`, `bun run lint`, `bun run test` and `bun run build`. Try the CLI with
`node dist/cli.js my-app` (or `--yes` plus flags). Working with a coding agent? [AGENTS.md](AGENTS.md) and
`.agents/skills/` are written for it.

## How a template change goes
1. Read the official docs for what you're changing first; `template-sources.json` lists the pages each template
   follows. Never write an API, flag or config key from memory.
2. Change the template. Code both frameworks share lives in `template/app/` (`{{#tanstack-start}}`/`{{#next}}` for the
   lines that differ); each framework's own files in `template/frameworks/<name>/`. Add-on lines go inside
   `{{#flag}} … {{/flag}}` blocks, on one line when inline; files that belong to an add-on get a `when` rule in
   `manifest.json` (flags are listed in `src/kit-config.ts` → `renderFlags`). Use the file-name vocabulary in each
   framework's `.agents/skills/project-structure/SKILL.md`.
3. `bun run test`, then `bun run build && bun run verify:build` (or `--only <combination>`).
4. Changed pages in `template-sources.json`? Re-read them and run `bun run verify:docs --accept`.
5. A package's new major checked? Update `verified` in `manifest.json` and the date in `verifiedOn`.
6. One line in CHANGELOG.md.

Adding an add-on, skill pack, provider, deploy target or framework touches more places:
`.agents/skills/new-option/SKILL.md` lists them all. Community skills are never copied here: name them in
`manifest.json` → `skillPacks` (the maker's official skill first: https://www.skills.sh/official) and check them with
`bun run verify:skills`.

## When the canary fails
The weekly canary opens an issue with the failing combination, the changed doc pages, or a skill its maker renamed
or removed (fix `skillPacks`). Reproduce with
`bun run verify:build --only <name>` (failed projects are kept, with their path printed). If a new major of a
package breaks the stack and the fix needs upstream changes, cap it in `manifest.json` → `holdBack` with a reason,
and remove the cap once it works.

## Pull requests
Keep them small and focused. CI runs typecheck, lint, the unit tests, the build, `verify:package` and two real projects.

## Releasing
Maintainers: [RELEASING.md](RELEASING.md).
