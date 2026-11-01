---
name: project-setup
description: "Finishes a project created with create-agent-ready-app, adopts the kit in an existing repo, or adds or removes an add-on. Use when starting work on a new project or adding an API, database, logins, email or UI library."
---

# Project setup

Every step uses the official CLI or docs of the tool involved (skill `official-docs`). Ask before anything remote.

## Just created (the CLI already scaffolded, installed and checked everything)
1. Read PROJECT.md and fill **What** (name, domain, type, purpose) with the human, in their words.
{{#dotenv}}
2. The human copies `.env.example` to `.env` and fills it in{{#auth}} (`{{dlx}} auth@latest secret` makes the auth secret){{/auth}}.
   Agents never create, read or write `.env`. Until it exists, test with throwaway values set only for that command.
{{/dotenv}}
{{#postgres}}
3. Local database: `docker compose up -d`, then `{{run}} db:migrate` (ask first).
{{/postgres}}
{{#d1}}
3. Local database: `{{run}} db:migrate` (ask first).
{{/d1}}
4. `{{run}} docs:sync`, then fill docs/DEPLOYMENT.md (URLs, where secrets are set).
{{#cloudflare}}
   Replace the placeholder ids in `wrangler.jsonc` once the resources exist (DEPLOYMENT.md → First-time setup).
{{/cloudflare}}
5. Leave design/DESIGN.md for the `website-design` skill, which gathers the design inputs in order before the first
   page; the home page is a placeholder.
6. Once the repo is on GitHub, the human turns on Settings → Actions → General → "Allow GitHub Actions to create and
   approve pull requests", so the weekly agent-skills update can open its pull request. Dependabot and workflow
   changes: skills `dependabot` and `github-actions-hardening`.
7. `{{run}} log "Project set up" --by <agent>`.

## Existing project (adopting the kit)
1. `{{dlx}} create-agent-ready-app@latest install .` adds only the agent setup (AGENTS.md, skills, scripts, guardrails);
   it detects the add-ons from package.json. Old AGENTS.md, CLAUDE.md, .cursorrules and similar files move to
   `docs/legacy-agents.md`: fold the rules that still apply into PROJECT.md → Rules for agents, then delete it (ask).
2. Fill PROJECT.md from what's there (`package.json`, routes, a quick folder listing). Don't explore deeply.
3. Don't restructure. List the gaps (structure, checks, SEO, security) as one proposed Big task and ask.

## Adding an add-on later (Guarded)
1. Ask one yes/no question: the add-on, the packages it adds, the files it creates.
2. `{{dlx}} create-agent-ready-app@latest add <add-on> .` creates the add-on's files that don't exist yet, refreshes
   AGENTS.md and the skills, installs its skill pack, and prints the packages to add.
3. `{{add}}` those packages. Then wire it into the files the project already owns, following the add-on's files in
   the create-agent-ready-app repository (`template/frameworks/`) and the official docs:
   - query: {{#tanstack-start}}`src/router.tsx` (QueryClient + SSR integration) and `src/routes/__root.tsx` (devtools panel){{/tanstack-start}}{{#next}}`src/shared/lib/tanstack/query-provider.tsx` in `src/app/layout.tsx`{{/next}};
   - shadcn: `{{dlx}} shadcn@latest apply --preset nova`, then `add` the components you need;
   - auth: the guards under {{#tanstack-start}}`src/routes/_private/`{{/tanstack-start}}{{#next}}`src/app/(private)/`{{/next}} and `{{run}} auth:generate`, then `{{run}} db:generate`.
4. `{{run}} docs:sync`, `{{run}} check`, update PROJECT.md → Stack and Decisions, and add a log line.

## Removing an add-on (Guarded)
`{{dlx}} create-agent-ready-app@latest remove <add-on> .` removes its kit files, skills, scripts and permissions.
Deleting its code and packages is a Big task: `rg` for every use, delete it, then `{{run}} check`.

## Agent skills
- The community skills in `.agents/skills/` come from their makers (`skills-lock.json` records each source and a
  hash). `{{run}} skills:update` refreshes them; read the diff before committing, as for any code change.
- More skills: prefer the official ones from the tool's makers (https://www.skills.sh/official); skill `find-skills`, or `{{dlx}} skills@latest add <owner/repo> --skill <name> -a universal -a claude-code`
  (ask first). An optional kit pack: `{{dlx}} create-agent-ready-app@latest add <pack> .` (marketing, security-review…).

## Updating the kit
`{{run}} kit:update` refreshes AGENTS.md, skills and scripts. Kit files changed in this project are kept and reported;
put project-specific rules in PROJECT.md instead of editing kit files.
