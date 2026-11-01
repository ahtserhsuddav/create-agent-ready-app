---
name: new-option
description: "Adds a choice to the CLI: an add-on, a skill pack, a database, an email provider, a deploy target or a framework. Use when the kit should support something new (Stripe, Neon, Netlify, Remix…)."
---

# New option

Every option stays optional: a project that doesn't pick it gets no file, package, script, skill, permission or
AGENTS.md line from it. The template-change skill's rules apply (docs first, real builds); this is the list of places
an option touches.

## 1. Declare it in manifest.json
- **The option:** `addOns` (`label`, `hint`, `requires`), or `databases` (`deploys`), `emailProviders`, `deploys`;
  then list its id in an `addOnGroups` entry (pick-one groups: `pickOne`). Add it to the `full` preset, and to `app`
  if most apps need it.
- **Its skills:** a `skillPacks` entry with `when: ["<flag>"]` (or `optional: true` for a checkbox in the Agent skills
  group), naming skills from their makers' repositories only; `bun run verify:skills` checks the names.
- **Packages:** `packages.<flag>` lists names only (`deps`, `dev`): versions are resolved at create time. Add the
  checked major of each to `verified`.
- **Everything else is keyed by flag** (`a+b` means both): `files` (a `when` rule for every new file or folder),
  `scripts`, `claudeSettings`, `shadcn.components`. Framework-specific keys combine flags: `next+cloudflare`.

## 2. Wire the CLI
- **Flags:** `src/kit-config.ts` → `renderFlags` (the option's flag, plus any derived flag other templates need) and
  `renderVars`.
- **Choices:** ids flow through `src/create/choices.ts` (`kindOf`, `applyIds`); a new kind of choice needs it there
  and in `src/create/prompts.ts`. A hard requirement goes in `requires`: the CLI asks for it in prompts and stops in
  flag mode, and never adds it silently.
- **Setup steps:** `src/create/scaffold-base.ts` for wrangler bindings and `secrets.required`;
  `src/create/official-clis.ts` for an official generator CLI (always `@latest`).
- **Detection:** `src/detect.ts`, so `install` recognises the option in an existing project.

## 3. Templates
- **Code:** shared code under `template/app/src/`, framework-only code under `template/frameworks/<name>/src/`, in
  category/vendor/role folders (`server/<category>/<vendor>/<role>.ts`, `shared/<category>/<vendor>/client.ts`).
- **Lines in shared files**, inside `{{#flag}}` blocks:
  - `template/agent/`: `AGENTS.md`, `docs/DEPLOYMENT.md`, `docs/RUNBOOK.md`, `docs/official/sources.json`, the
    `security` skill's references.
  - `template/app/`: `.env.example`, `src/server/config/env.ts`.
  - `template/frameworks/<name>/`: the `project-structure` skill, `knip.json`, `.agents/biome.kit.json`.
- **Docs:** add the pages the new templates follow to `template-sources.json`, then run `bun run verify:docs --accept`.

## 4. Prove it
- `tests/unit/only-checked.test.ts`: nothing from the option appears without it. `tests/unit/choices.test.ts`: its
  requirements.
- `scripts/verify-build.ts`: at least one combination includes the option (add one if none does); run it.
- README.md options table, and one CHANGELOG line.

## A new framework
- `manifest.json` → `frameworks.<id>`: a `scaffold` command using `{name}` `{dir}` `{pm}` `{deploy}`, plus
  `expectFiles`.
- `template/frameworks/<id>/`: the app overlay, its `project-structure` and `new-feature` skills, `biome.json`,
  `knip.json` and `.agents/biome.kit.json`. The agent setup in `template/agent/` and the code in `template/app/` are
  shared: add `{{#<id>}}` lines where they differ.
- A `skillPacks` entry for the framework's own skills, and its knowledge source in AGENTS.md → Framework knowledge.
- Detection in `src/detect.ts`, and its own verify:build combinations.
