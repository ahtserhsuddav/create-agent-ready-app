---
name: template-change
description: "Changes what generated projects get: a template file, a manifest rule, a package or a verified major. Also fixes canary failures (verify:build or verify:docs). Use for any edit under template/ or to manifest.json."
---

# Template change

Everything under `template/` renders into other people's projects, so a mistake ships to every new project. Check
against the official docs and a real build, never from memory.

## Steps
1. **Docs first.** Find the template in `template-sources.json` and read those pages (`.md` variants first). An API,
   flag or config key that no official page shows doesn't go in.
2. **Edit inside the flag system.**
   - Add-on lines go in `{{#flag}} … {{/flag}}` blocks (`{{^flag}}`: the flag is off). Inline blocks stay on one line.
   - A file or folder that belongs to an add-on gets a `when` rule in `manifest.json` → `files` (first match wins;
     `"!flag"` means off; a path ending in `/` covers the folder).
   - Flags are the choices plus the derived ones in `src/kit-config.ts` → `renderFlags` (`server`, `static`,
     `error-model`, `hono-context`, `server-env`, `dotenv`, `auth-pages`…); variables are in `renderVars`.
   - Code both frameworks share lives in `template/app/`; the few lines that differ use `{{#tanstack-start}}` and
     `{{#next}}`, and "not on Workers" is `{{^cloudflare}}`. Framework-only files go in `template/frameworks/<name>/`.
   - Names follow the vocabulary in each framework's `.agents/skills/project-structure/SKILL.md`.
3. **Test.** `bun run test` renders every template (`only-checked.test.ts` catches add-on leaks). Then
   `bun run build && bun run verify:build --only <name>` for each affected combination (listed in
   `scripts/verify-build.ts`; a failed project is kept and its path printed).
4. **Record.** Re-read changed doc pages, then `bun run verify:docs --accept`. A new major checked: `verified` and
   `verifiedOn` in `manifest.json`. One line in CHANGELOG.md.

## Canary failures
- **verify:build:** reproduce with `--only <name>`, read the kept project's error, fix the template.
- **A new major breaks the stack** and needs an upstream fix: cap it in `manifest.json` → `holdBack`
  (`{ "major": "…", "reason": "… <issue link>" }`), and remove the cap once it works.
- **verify:docs drift:** read what changed. Update the template only if the change affects it, then `--accept`.
- **verify:skills:** a maker renamed or removed a skill. Point `manifest.json` → `skillPacks` at its new name (check
  with `npx skills add <repo> --list`), or drop it; then `bun run test`.

## Gotchas
- Project-owned files (`owner: "project"`, most app code) are written once at create; `update` never touches them, so
  a fix there only reaches new projects. Say so in the CHANGELOG line.
- npm never packs `.npmrc`, `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock` or `bun.lockb`, and installs have
  historically renamed `.gitignore`. Generate such files from `manifest.json` instead (like `gitignore` and
  `gitattributes`). `bun run verify:package` fails when a template file is missing from the package.
- `install` recognises add-ons by package name in `src/detect.ts`: when a package is renamed, update it there too.
- Dependabot can't read `template/agent/.github/workflows/` (they're templates). When it bumps an action in
  `.github/workflows/`, bump the same action there.
