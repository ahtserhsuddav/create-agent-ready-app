# AGENTS.md — working on create-agent-ready-app itself

Everything under `template/` is a **template** for generated projects, not instructions for you: its AGENTS.md,
CLAUDE.md and skills describe projects the CLI creates (`{{run}}`, `{{#flag}}` are placeholders).

## Layout
- `cli.ts`, `src/` the CLI (Node-compatible: no Bun APIs; built to `dist/cli.js` with `bun run build`)
- `manifest.json` frameworks, add-ons and their groups, presets, file rules (`when` flags), scripts, package names,
  verified majors, permissions, and `skillPacks` (the community skills each choice installs)
- `template/agent/` agent setup for every project · `template/app/` app code both frameworks share (server/, shared/,
  auth forms, the feature scaffolder) · `template/frameworks/{tanstack-start,next}/` each framework's own files
  (a later root's file with the same path wins)
- `template-sources.json` the official docs each template follows · `scripts/verify-*.ts` · `tests/unit/`
- `.github/workflows/` ci (every PR) · canary (weekly) · release (publishes to npm) · `.agents/skills/` your skills

## Commands
`bun run typecheck` · `bun run lint` · `bun run test` · `bun run build` · `bun run verify:package` (the tarball as npm users get it) ·
`bun run verify:build [--only <name> | --quick]` · `bun run verify:docs [--accept]` · `bun run verify:skills` ·
try it: `node dist/cli.js /tmp/x --yes --framework next --preset app`

## Rules
- Read the official docs before changing a template (`template-sources.json` lists them); never from memory.
- Every add-on stays optional: its files get a `when` rule, its lines a `{{#flag}}` block. `tests/unit/only-checked.test.ts`
  must keep passing. Inline blocks open and close on one line.
- Code both frameworks can share goes in `template/app/` with `{{#tanstack-start}}`/`{{#next}}` for the few lines that
  differ; "not on Workers" is `{{^cloudflare}}`.
- Community skills are never copied into this repo: `manifest.json` → `skillPacks` names them, and projects install
  them from their makers at create time. Prefer the official skill of a tool's maker (https://www.skills.sh/official)
  over a community one, and over writing a kit skill; kit skills hold only this project's own wiring.
- Generated code follows the naming vocabulary in each framework's `.agents/skills/project-structure/SKILL.md`.
- After a template change: `bun run test`, then `verify:build` for the affected combinations. One CHANGELOG line.
- The version lives only in package.json. Packages the CLI imports are devDependencies: the build bundles them, so
  `npm create` installs nothing else.
- Never publish, push, tag or create releases without the maintainer's yes.

## Skills (read the one that fits before you start)
- `.agents/skills/template-change/SKILL.md` any edit under `template/` or to `manifest.json`, and canary failures
- `.agents/skills/new-option/SKILL.md` a new add-on, skill pack, database, email provider, deploy target or framework
- `.agents/skills/release/SKILL.md` preparing a version for npm (the maintainer publishes)
