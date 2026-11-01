---
name: official-docs
description: "Version-matched official docs for any library API, config key or CLI flag ({{framework}}, React, Tailwind, shadcn, Hono, Drizzle, Better Auth, Zod, Cloudflare…), and the rules for adding or upgrading packages."
---

# Official docs first

Your memory of an API may be out of date. The installed version's official docs win; if they disagree with your
memory, follow the docs. If the docs don't cover the case, ask the human. Never guess.

## Find the answer (stop at the first source that answers)
1. `{{run}} docs:sync` (fast, idempotent). It refreshes `docs/official/INDEX.md` from package.json: installed
   version, docs URL, local llms index, skills shipped in the package, MCP. Then `rg "<package>" docs/official/INDEX.md`.
2. **The framework's own knowledge**, exact to the installed version:
{{#next}}
   the Next.js docs bundled in `node_modules/next/dist/docs/` (`rg -l "<topic>" node_modules/next/dist/docs`).
{{/next}}
{{#tanstack-start}}
   the skills TanStack ships in its packages: `{{exec}} intent list`, then `{{exec}} intent load <package>#<skill>`.
{{/tanstack-start}}
   Other packages may ship skills too: `ls node_modules/<pkg>/skills/`.
3. **Skills from the stack's makers** in `.agents/skills/` (AGENTS.md → Skills lists them), such as Vercel's React
   rules{{#hono}}, Hono's `hono`{{/hono}}{{#auth}}, Better Auth's `better-auth-best-practices`{{/auth}}{{#cloudflare}}, Cloudflare's `workers-best-practices`{{/cloudflare}}.
4. **Types** show the exact signature: `rg -n "<symbol>" node_modules/<pkg>/dist -g "*.d.ts"`.
5. **Pages fetched before:** `rg -n "<topic>" docs/official/cache/`.
6. **One new page:** find it in the package's local llms index (path in INDEX.md), then `{{run}} docs:get <page-url>`.
   It saves the page as Markdown and prints a heading outline with line numbers. Read only the section you need.
{{#tanstack-start}}
   TanStack docs also come straight from its CLI: `{{dlx}} @tanstack/cli doc <library> <path>` or `search-docs <query>`.
{{/tanstack-start}}
{{#next}}
   Next.js pages have a Markdown version at the same URL plus `.md` (index: https://nextjs.org/docs/llms.txt).
{{/next}}
7. **Docs MCP**, when configured in `.mcp.json`{{#cloudflare}} (Cloudflare docs){{/cloudflare}}{{#auth}} (Better Auth){{/auth}}.

Never write APIs, config keys or CLI flags from memory. Never copy from blogs, Stack Overflow or old tutorials.
Never read an `llms-full.txt` whole, and never install a package just to read its docs.

## Say what you used
Name the doc you relied on in your reply or the task Log, one line (URL or path).

## Adding a package (Guarded: ask first)
1. Prefer what's already installed, the platform (Web APIs{{#cloudflare}}, Workers bindings{{/cloudflare}}) or a small local function.
2. Check that it's maintained and official (npm `homepage` and `repository` on the vendor's own domain or GitHub
   org), its size and its licence.
3. Ask one yes/no question: the package, why it's needed, the alternative you considered.
4. `{{add}} <pkg>` (`{{addDev}}` for tooling), then `{{run}} docs:sync`. A row marked **unverified** means: confirm the
   official docs and add an entry to `docs/official/sources.json` (`docs`, plus `llms`, `skill` or `mcp` if the
   vendor has them).
5. A core piece of the stack? Add one line to PROJECT.md → Stack.

## Upgrading a package (Guarded)
- `{{outdated}}` lists what's behind. Dependabot opens weekly pull requests; CI checks each one.
- Minor and patch updates: merge when CI is green. A major: read the changelog or migration guide for every major
  between the installed and the target version, prefer official codemods, upgrade one package family at a time
  (all `@tanstack/*` together), then `{{run}} docs:sync` and `{{run}} check`.
