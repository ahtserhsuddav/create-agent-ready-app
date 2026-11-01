# Agent Ready · create-agent-ready-app

[![npm version](https://img.shields.io/npm/v/create-agent-ready-app)](https://www.npmjs.com/package/create-agent-ready-app)
[![CI](https://github.com/ahtserhsuddav/create-agent-ready-app/actions/workflows/ci.yml/badge.svg)](https://github.com/ahtserhsuddav/create-agent-ready-app/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/create-agent-ready-app)](LICENSE)

Start a **TanStack Start** or **Next.js** app that coding agents already know how to work in:
- a production stack with only the add-ons you pick;
- the framework's own version-matched docs;
- the official agent skills of the companies that make the stack, kept up to date;
- a design workflow that starts from your references.

```sh
bun create agent-ready-app my-app
pnpm create agent-ready-app my-app
npm create agent-ready-app@latest my-app
```

**Contents:** [Quick start](#quick-start) · [What you choose](#what-you-choose) ·
[What a project gets](#what-a-project-gets) · [Agent skills](#agent-skills-in-three-layers) ·
[Design workflow](#the-design-workflow) · [Commands](#commands) · [Flags](#flags-for-ci-and-agents) ·
[Requirements and platforms](#requirements-and-platforms) · [Developing this repository](#developing-this-repository)

## Quick start
1. Run one of the commands above. They all download the CLI once and run it; nothing is installed globally.
   - The CLI detects the package manager you started it with (bun, pnpm or npm) and suggests it; you can change it
     in the prompts.
   - With npm, keep `@latest` so npm doesn't reuse an older cached copy.
2. Answer a few questions: framework, runtime, add-ons and an optional design language.
3. The CLI does the rest:
   - builds the project on the framework's official scaffolder;
   - installs every package at its newest release, showing the package manager's own progress;
   - installs the agent skills;
   - checks that the result typechecks, lints, tests and builds.
4. `cd my-app`, then start the dev server (`bun run dev`, `pnpm run dev` or `npm run dev`).
5. Ask your coding agent: *"Read AGENTS.md, then finish the project setup (skill project-setup)."*

The kit isn't a framework or a runtime dependency. Once created, the project is plain code that you own.

### Who it's for
- **Developers starting a React app** who want auth, a database, an API and forms wired the way each library's
  official docs describe.
- **People who build with coding agents** (Claude Code, Codex, Cursor, Copilot, Gemini, OpenCode…).
  - Every project has one AGENTS.md contract that all of them read.
  - It also gets the official skills of Vercel, Better Auth, Cloudflare, GitHub, Resend, Stripe, Supabase and others.
- **Anyone tired of stale templates.** Packages and skills are fetched the day you run it.

## What you choose
| Step | Options |
| --- | --- |
| Framework | TanStack Start · Next.js |
| Runtime | Bun (scripts run with `bun --bun`) · Node.js with pnpm or npm |
| Add-ons (all optional, in groups) | **UI** shadcn/ui · **Data** TanStack Query · **Forms** TanStack Form · **API** Hono with a typed RPC client · **Database** Postgres or Cloudflare D1 (Drizzle) · **Authentication** Better Auth (email and password) · **Email** Resend or ZeptoMail · **Deployment** Node server, Vercel or Cloudflare · **SEO** robots.txt, sitemap.xml, llms.txt, JSON-LD |
| Extra agent skills | Marketing & SEO · Security review · Payments (Stripe) · Next.js workflows |
| Design language | Decide later, or start from one of 80+ DESIGN.md files ([awesome-design-md](https://github.com/VoltAgent/awesome-design-md)), searchable by name or style |

- **Only what you check is set up:** no package, file, script or agent rule comes from an add-on you didn't pick.
- **Requirements are asked, not added silently:** when one choice needs another (Better Auth needs a database, D1
  needs Cloudflare), the CLI asks.

## What a project gets
- **The official base:** TanStack's or Next.js's own scaffolder at its latest release, with the kit's files on top.
- **A structure you can find your way around.** Folders go category → vendor → role, files are kebab-case, imports
  use `#/`, and there are no barrel files:
  ```
  src/routes/ or src/app/        pages (thin)
  src/features/<name>/           components/ hooks/ schema.ts functions.ts|actions.ts server/{routes,service,tables}.ts
  src/server/api/hono/app.ts     src/server/auth/better-auth/setup.ts   src/server/db/drizzle/client.ts
  src/shared/api/hono/client.ts  src/shared/components/ui/ (shadcn)     src/shared/assets/icons/*.svg
  ```
- **Working flows, not stubs:**
  - email and password sign-up and sign-in and a protected dashboard;
  - with Email, address verification and password reset;
  - a typed Hono API;
  - migrations and an in-memory test database;
  - `new:feature <name>`, which scaffolds a whole feature, already wired in.
- **SVGs as components** in both frameworks: drop a file in `src/shared/assets/icons/` and
  `import Logo from '#/shared/assets/icons/logo.svg?react'`.
- **Guardrails:**
  - Claude Code permissions that keep agents out of `.env` files;
  - Biome import boundaries;
  - Knip for dead code;
  - CI with a secret scan;
  - Dependabot.

## Agent skills, in three layers
1. **The framework's own knowledge, matched to the installed version.** It updates with the packages.
   - Next.js projects get the docs Next.js bundles in `node_modules/next/dist/docs/`, and Next.js's managed block in
     AGENTS.md.
   - TanStack Start projects get the skills TanStack ships inside its packages, through
     [TanStack Intent](https://tanstack.com/intent/latest/docs/overview).
2. **Skills from their makers,** installed with the open [`skills`](https://github.com/vercel-labs/skills) CLI
   ([skills.sh](https://www.skills.sh/)) the day you create the project. Where a tool's maker publishes an
   [official skill](https://www.skills.sh/official), that's the one installed.
   - Every project:
     - **React:** Vercel's `vercel-react-best-practices`, `vercel-composition-patterns`,
       `vercel-react-view-transitions`, `vercel-react-native-skills`.
     - **Design:** `design-taste-frontend` ([taste-skill](https://github.com/Leonxlnx/taste-skill)), Anthropic's
       `frontend-design`, Vercel's `web-design-guidelines` and `writing-guidelines`, Cloudflare's `web-perf`.
     - **Testing:** Microsoft's `playwright-cli` and Anthropic's `webapp-testing`.
     - **GitHub:** GitHub's `git-commit`, `github-actions-hardening` and `dependabot`.
     - **Workflow** from [Matt Pocock](https://github.com/mattpocock/skills): `grill-me`, `tdd`,
       `improve-codebase-architecture`, `diagnosing-bugs`, `handoff`…
     - **Discovery:** `find-skills`.
   - With your add-ons:
     - **shadcn/ui:** `shadcn`.
     - **Better Auth:** Better Auth's skills, plus Cloudflare's `turnstile-spin` for bot checks.
     - **Postgres:** Supabase's `supabase-postgres-best-practices`.
     - **Hono:** `hono`.
     - **Cloudflare:** Cloudflare's `cloudflare`, `workers-best-practices` and `wrangler`.
     - **Vercel:** `deploy-to-vercel`.
     - **Email:** Resend's `react-email` and `email-best-practices`, plus `resend` with Resend.
     - **Next.js:** `next-dev-loop`.
   - Optional packs:
     - Marketing & SEO;
     - Security review (Sentry);
     - Payments (Stripe's `stripe-best-practices`, `stripe-docs`, `upgrade-stripe`);
     - Next.js workflows.
3. **The project's own skills,** for what no maker's skill knows: structure, new features, official docs, the design
   flow, SEO and security wiring, database changes and releases. Each points to the official skill for the details.

### Where skills live, how agents use them, how they stay current
- **One folder for every agent:**
  - Each skill is a folder with a `SKILL.md` in `.agents/skills/`. Codex, Cursor, Copilot, Gemini, OpenCode and
    Cline read that folder.
  - `.claude/skills/` points to the same folders for Claude Code (links on macOS and Linux, copies on Windows).
  - `skills-lock.json` records where each community skill came from and a hash of its content.
- **Loaded on demand:**
  - At the start of a session an agent sees only each skill's name and one-line description (`doctor` reports the
    total). It opens the full skill when a task matches.
  - AGENTS.md lists the installed skills and routes the big moments: design work starts with `website-design`, a
    hard bug with `diagnosing-bugs`, a commit with `git-commit`.
- **Kept current:**
  - `<run> skills:update` downloads each source again and replaces the skills whose content changed.
  - A weekly GitHub Action does the same and opens a pull request, for you to review before agents follow the new
    instructions.
  - The Next.js docs and TanStack's skills change when Dependabot updates those packages. The project's own skills
    change with `<run> kit:update`.
  - `design/DESIGN.md` is copied once and is yours from then on, so a change upstream never restyles a live site.

## The design workflow
Before an agent designs any page, skill `website-design` gathers four inputs in this order and writes them into
`design/DESIGN.md` → Design inputs. An earlier input always wins.
1. **Your references and design documents:** screenshots in `design/references/`, links, brand guides, a filled
   DESIGN.md.
2. **If there are none, an [awesome-design-md](https://github.com/VoltAgent/awesome-design-md) base:**
   - the agent runs `<run> design:md list` and proposes 2–3 entries that fit your brief;
   - it copies the one you pick, credited, with brand names replaced.
3. **[taste-skill](https://github.com/Leonxlnx/taste-skill)'s art direction** on top. With a fixed palette and type, it
   plans only composition, imagery and sections.
4. **Real sites for the site's needs:** the project type's reference sites and galleries, studied for the patterns
   the page needs (pricing, checkout, docs…).

Then it builds with `frontend-design` (and `shadcn`) and reviews in a browser against `web-design-guidelines`,
`writing-guidelines` and `web-perf`.

## Commands
| Command | What it does |
| --- | --- |
| `create-agent-ready-app [dir]` | Creates a project. Asks questions, or uses flags with `--yes`. |
| `create-agent-ready-app install [dir]` | Adds the agent setup and skills to an existing project, without app code. Add-ons are detected from package.json. |
| `create-agent-ready-app update [dir]` | Refreshes the kit's files and skills. Inside a project: `<run> kit:update`. |
| `create-agent-ready-app add <id> [dir]` | Adds an add-on or an optional skill pack (`add auth`, `add marketing`). |
| `create-agent-ready-app remove <id> [dir]` | Removes the kit files, skills, scripts and permissions of an add-on or skill pack. |
| `create-agent-ready-app doctor [dir]` | Checks skills, links, size budgets and the agent's startup context. |

For an existing project, run them with `npx create-agent-ready-app@latest <command> .` (or `bunx`, `pnpm dlx`).
- **Your text is kept:** the kit writes its rules inside its own block in AGENTS.md, and never touches your text or
  the frameworks' blocks around it.
- **Edited kit files are reported:** a kit file you changed is kept and reported, never overwritten without
  `--force`.

## Flags, for CI and agents
`--yes` skips the questions and takes the choices from flags, with defaults for the rest:
```sh
bun create agent-ready-app my-app --yes --framework next --preset app
pnpm create agent-ready-app my-app --yes --runtime node --pm pnpm --add-ons shadcn,query,form,hono,postgres,auth,resend,vercel
npm create agent-ready-app@latest my-app -- --yes --framework tanstack-start --preset full --skills marketing
```
| Flag | Values |
| --- | --- |
| `--framework` | `tanstack-start` · `next` |
| `--runtime` · `--pm` | `bun` · `node` · and `bun`, `pnpm` or `npm` |
| `--add-ons` | `shadcn,query,form,hono,auth,seo`, plus one database (`postgres`, `d1`), one email provider (`resend`, `zeptomail`) and one deploy target (`node`, `vercel`, `cloudflare`) |
| `--preset` | `static` (SEO, shadcn/ui) · `app` (plus Query, Form, Hono, Postgres, Better Auth) · `full` (plus Resend) |
| `--skills` | `marketing,security-review,payments,next-workflows` |
| `--design` | an awesome-design-md entry name, or `none` |
| Other | `--versions latest\|verified` · `--quiet` · `--no-install` · `--no-git` · `--no-skills` · `--no-check` · `--dry-run` · `--force` |

npm only passes flags along after `--`. `--help` lists everything.

## Always the newest packages
- **Version choice:**
  - Packages from the scaffold get the newest release within the major the scaffolder chose.
  - Add-on packages get their newest release.
  - The kit records the majors its templates were checked with and warns about anything newer; `--versions
    verified` stays within them.
- **Weekly check:** an automated job creates every combination at that day's versions. It also checks that the
  official docs the templates follow haven't changed and that every skill still exists upstream. When something
  breaks, it opens an issue in this repository.

## Requirements and platforms
- **To create a project:**
  - Node.js 22.20 or newer, or Bun 1.3 or newer;
  - git;
  - pnpm, only if you pick it.
- **To run some add-ons:** Docker for a local Postgres; a Cloudflare or Vercel account to deploy there.
- **Next.js on Cloudflare:** runs through [OpenNext](https://opennext.js.org/cloudflare). Cache Components are off
  there until OpenNext runs them reliably; Vercel and Node server projects use Next.js's recommended defaults.

| Platform | Status |
| --- | --- |
| macOS | Developed and tested here. |
| Linux | Tested in CI on every pull request and in the weekly check. |
| Windows | Supported in the code (Windows shell for package managers, skill copies instead of links), but not tested yet. OpenNext recommends WSL for Next.js on Cloudflare. Please report what you find. |

## Privacy and supply chain
- **No telemetry:** the CLI collects none, and it sets `DO_NOT_TRACK=1` for the tools it runs.
- **No bundled skills:** community skills come straight from their makers' repositories, recorded with a content hash
  in `skills-lock.json`. This package contains none of them.
- **No runtime dependencies:** the package is one bundled file plus its templates.
- **Signed releases:** releases are published from GitHub Actions with npm trusted publishing and carry a provenance
  statement.

## Developing this repository
```sh
git clone https://github.com/ahtserhsuddav/create-agent-ready-app.git
cd create-agent-ready-app
bun install
bun run build && node dist/cli.js /tmp/my-app      # try the CLI
```

| Path | What it holds |
| --- | --- |
| `cli.ts`, `src/` | The CLI (Node-compatible, bundled to `dist/cli.js`) |
| `manifest.json` | Frameworks, add-ons and groups, presets, file rules, scripts, package names, skill packs, permissions |
| `template/agent/` | The agent setup every project gets: AGENTS.md, skills, scripts, CI |
| `template/app/` | App code both frameworks share |
| `template/frameworks/<name>/` | Each framework's own files |
| `template-sources.json` | The official docs each template follows |
| `scripts/verify-*.ts`, `tests/unit/` | End-to-end checks and unit tests |

| Script | Checks |
| --- | --- |
| `bun run typecheck` · `lint` · `test` · `build` | The kit itself |
| `bun run verify:package` | The tarball as npm users get it |
| `bun run verify:build [--only <name> \| --quick]` | Creates, checks, builds and smoke-tests real projects |
| `bun run verify:docs` · `verify:skills` | The official docs and the declared skills haven't changed upstream |

Issues and pull requests are welcome. [CONTRIBUTING.md](CONTRIBUTING.md) explains how a template change goes; coding
agents get [AGENTS.md](AGENTS.md). Security reports go through [SECURITY.md](SECURITY.md); maintainers release with
[RELEASING.md](RELEASING.md). This is a 0.x release, so options may still change between minor versions; the
[CHANGELOG](CHANGELOG.md) lists every change.

## Credits
- **Skills:** they belong to their makers: Vercel, Anthropic, Microsoft, GitHub, Leonxlnx, Matt Pocock, shadcn,
  Better Auth, Supabase, Hono, Cloudflare, Resend, Corey Haines, Sentry and Stripe.
- **Design languages:** VoltAgent's awesome-design-md.
- **Version-matched framework knowledge:** TanStack Intent and Next.js.

## License
[MIT](LICENSE)
