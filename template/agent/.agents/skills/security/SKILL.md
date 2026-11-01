---
name: security
description: "This project's security rules and review checklist, and which official skill covers each topic. Use when code handles input, forms, uploads, secrets, cookies, auth, permissions, API routes, webhooks, workflows or the database, after Guarded changes, and before releases."
---

# Security

Apply the rules while you write the code. Run the review checklist on Guarded changes and before releases. It
isn't needed for Quick changes to copy or styling. The details come from the skills their makers publish; this page
holds what is specific to this project.

## Always
- **Validate every input at the boundary** with Zod: {{#tanstack-start}}server functions use `.validator(schema)`{{/tanstack-start}}{{#next}}Server Actions call `schema.parse(input)` first{{/next}}{{#hono}}, Hono routes `validate("json", schema)` from `#/server/api/hono/middleware`{{/hono}}.
  Validate on the server even when the form also validates.
- **Authorize on the server, in the service or handler:** check who is asking and whether they may touch *this*
  record (ownership, role). Hidden buttons and route guards protect nothing; {{#tanstack-start}}server functions{{/tanstack-start}}{{#next}}Server Actions{{/next}} and API routes can
  be called directly.
- **Secrets** live only in the host's secret store ({{#cloudflare}}`{{exec}} wrangler secret put`{{/cloudflare}}{{^cloudflare}}the host's environment variables{{/cloudflare}}) and in the local `.env`, which
  agents never read. Nothing secret goes in {{#tanstack-start}}`VITE_*`{{/tanstack-start}}{{#next}}`NEXT_PUBLIC_*`{{/next}} variables or client code; those ship to browsers. Server
  code reads settings through `getEnv()`{{#server-env}} (`src/server/config/env.ts`){{/server-env}}, never at module load.
- **Never log** secrets, tokens, one-time codes, passwords or personal data. Clients get a generic error message;
  details go to the server log{{#hono}} (`src/server/api/hono/error-handler.ts` does this for the API){{/hono}}.
- **Output:** React escapes text. Never pass user content to `dangerouslySetInnerHTML` unless it's sanitised.
  Validate URLs from users (only `https:`/`mailto:`) before rendering them as links.
- **Public forms** (sign-up, contact): rate limiting and a bot check.
{{#auth}}
  Skill `turnstile-spin` sets up Cloudflare Turnstile with server-side verification (ask first: it creates a widget
  in the human's Cloudflare account).
{{/auth}}
- **Uploads:** check type and size on the server, store them under random keys, and never serve user-uploaded
  HTML or SVG from the app's own origin.
- **Randomness** for tokens and IDs: `crypto.randomUUID()` or `crypto.getRandomValues()`, never `Math.random()`.
- **Dependencies:** ask before adding one; keep `{{lockfile}}` committed; CI runs `{{audit}}`. Dependabot settings:
  skill `dependabot`.
- **Workflows** in `.github/workflows/`: skill `github-actions-hardening` before you add or change one (no
  untrusted `${{ }}` in `run:`, least-privilege `permissions:`, pinned actions).

## This project's wiring, per add-on
{{#auth}}
- **Better Auth:** skill `better-auth-security-best-practices` for the settings (rate limits, trusted origins,
  cookies, secrets). Here: `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` are read in `src/server/auth/better-auth/setup.ts`
  through `getEnv()`; extra origins go in `trustedOrigins` in `options.ts`, exact; {{#tanstack-start}}`tanstackStartCookies()`{{/tanstack-start}}{{#next}}`nextCookies()`{{/next}} stays the last
  plugin. Protect {{#tanstack-start}}server functions with `.middleware([authMiddleware])` (`#/server/auth/better-auth/middleware`){{/tanstack-start}}{{#next}}Server Actions and pages with `getSession()` (`#/server/auth/better-auth/session`){{/next}}{{#hono}} and API routes with `requireAuth`{{/hono}},
  then check ownership in the service. A plugin that adds tables means
  `{{run}} auth:generate`, then `{{run}} db:generate`.
{{/auth}}
{{#db}}
- **Database:** skill `supabase-postgres-best-practices` for SQL, indexes and access rules{{#d1}} (the parts that apply to SQLite){{/d1}}.
  Here: Drizzle's query builder only (`sql.raw()` never takes input); scope every query to the
  user (`and(eq(table.id, id), eq(table.ownerId, user.id))`); map rows to a client type so hashes and tokens never
  leave the server.{{#postgres}} Feature tables enable RLS (`.enableRLS()`) and the app connects server-side as the owner.{{/postgres}}{{#d1}} D1: at most 100 bound parameters per query, `db.batch()` for writes.{{/d1}}
  Migrations: skill `database-change`.
{{/db}}
{{#hono}}
- **Hono API:** skill `hono` for the framework. Here: `secureHeaders()` stays first in `src/server/api/hono/app.ts`;
  CORS only for real extra origins, never `*` with credentials; `csrf()` on cookie-auth routes that change data;
  `bodyLimit()` on upload and webhook routes; webhooks verify the signature on the raw body before parsing and are
  idempotent; `AppError` for expected failures. `src/shared/api/hono/client.ts` ships to browsers: no secrets there.
{{/hono}}
{{^server}}
- None yet: this project has no API, database or auth.
{{/server}}

## Review (Guarded changes and releases)
Run `references/review.md` against the diff (`git diff main...`) and fix every finding before shipping, or list
what's left as a follow-up for the human.{{#skills-security-review}} Skill `security-review` (Sentry) adds a deeper pass.{{/skills-security-review}} In Claude Code, `/security-review` also reviews the
branch.
