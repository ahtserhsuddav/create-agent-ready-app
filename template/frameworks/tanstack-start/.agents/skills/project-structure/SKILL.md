---
name: project-structure
description: "Folders, file naming, import rules, and how routes, features, the API, database, auth and SVG icons connect. Use before creating, moving or naming files, or on a restricted-import lint error."
---

# Project structure

Anyone, junior or senior, human or agent, should tell from a path what the code does and where new code goes.
The structure is predictable, so don't explore: go to the folder this page names.

## The tree: `category/vendor/role-file`
```
src/
  routes/                      URL → page (TanStack Router files). Thin: loaders call features, components render
    __root.tsx  index.tsx      HTML shell and head · "/"   (pricing.tsx "/pricing" · blog/$slug.tsx "/blog/:slug")
{{#hono}}
    api/$.ts                   every /api/* request → the Hono app
{{/hono}}
{{#auth}}
    api/auth/$.ts              Better Auth's endpoints · _private/ signed-in pages{{#auth-pages}} · _auth/ sign-in and sign-up{{/auth-pages}}
{{/auth}}
  features/<name>/             one business capability, named by its noun: billing, team-members, blog-posts
    components/<thing>.tsx     one component per file; components/ui/ for pieces only this feature uses
{{#query}}
    hooks/use-<thing>.ts       TanStack Query: queryOptions for loaders, hooks for components
{{/query}}
    schema.ts                  Zod schemas + inferred types (safe in the browser)
    content.ts                 page copy, links, image paths (no JSX)
{{#server}}
    functions.ts               server functions (createServerFn): safe to import from components and loaders
    server/                    server-only: service.ts (rules + queries){{#db}} · tables.ts (Drizzle){{/db}}{{#hono}} · routes.ts (Hono){{/hono}}
{{/server}}
  shared/                      generic, no business logic; never imports features{{#server}} or server/{{/server}}
    assets/icons/*.svg         SVG files; import them as components (below)
    components/<category>/     error/ toast/ form/ … and ui/ (shadcn's own files, never edited)
    lib/<vendor>/<role>.ts     e.g. lib/tanstack/query-client.ts
{{#hono}}
    api/hono/client.ts         the typed RPC client for /api/*
{{/hono}}
{{#auth}}
    auth/better-auth/client.ts the browser's Better Auth client
{{/auth}}
{{#server}}
  server/                      infrastructure only, one folder per category, the vendor inside
{{/server}}
{{#hono}}
    api/hono/                  app.ts (routes, AppType) · middleware.ts (validate{{#db}}, withDb{{/db}}{{#auth}}, requireAuth{{/auth}}) · error-handler.ts
{{/hono}}
{{#auth}}
    auth/better-auth/          setup.ts (getAuth) · options.ts · middleware.ts (authMiddleware) · tables.ts (generated)
{{/auth}}
{{#db}}
    db/drizzle/                client.ts (getDb) · middleware.ts (dbMiddleware) · tables.ts (all tables) · test-client.ts · migrations/
{{/db}}
{{#email}}
    email/                     {{emailProvider}}/send.ts (sendEmail) · templates/*.tsx (React Email)
{{/email}}
{{#server-env}}
    config/env.ts              getEnv(): every secret and setting, checked with Zod
{{/server-env}}
```

## File names say what the file does
| Name | Means |
| --- | --- |
| `app.ts` · `setup.ts` · `client.ts` | the Hono app · creates a vendor's server instance · the object other code calls |
| `middleware.ts` · `error-handler.ts` · `options.ts` | middleware for that category · errors → responses · plain settings |
| `tables.ts` · `schema.ts` | Drizzle tables, never Zod · Zod schemas, never tables |
| `functions.ts` · `routes.ts` · `service.ts` | server functions · Hono endpoints · business rules and queries |
| `content.ts` · `use-<thing>.ts` · `<thing>.tsx` | page copy · a hook · a component (`invoice-table.tsx` → `InvoiceTable`) |

- kebab-case files and folders. Never name a file after its folder (`server/…/server.ts`) or vaguely (`index.ts`,
  `utils.ts`, `helpers.ts`, `common/`, `misc/`). No barrel files. No default exports unless a framework needs one.
- One main export per file; split a file past about 250 lines. Create folders only when something goes in them.
- Types come from schemas and tables (`z.infer`, `typeof table.$inferSelect`).

## Where does it go?
| You're adding | Put it in |
| --- | --- |
| A page or URL | `src/routes/<path>.tsx`, thin |
| A component used by one feature · by 2+ features | `features/<name>/components/` · `src/shared/components/<category>/` |
| An icon or logo | the `.svg` file in `src/shared/assets/icons/`, then `import Logo from '#/shared/assets/icons/logo.svg?react'` |
{{#shadcn}}
| A shadcn/ui component | `{{dlx}} shadcn@latest add <component>`; customize by wrapping it, never inside `ui/` |
{{/shadcn}}
{{#db}}
| A table · business rules and queries | `features/<name>/server/tables.ts` · `features/<name>/server/service.ts` |
{{/db}}
{{#hono}}
| Data the UI reads or writes | a route in `features/<name>/server/routes.ts`, called through `hooks/` with the RPC client |
{{/hono}}
{{^hono}}
{{#db}}
| Data the UI reads or writes | a server function in `features/<name>/functions.ts`{{#query}}, wrapped in `hooks/`{{/query}} |
{{/db}}
{{/hono}}

## Import rules (Biome enforces them: `{{run}} lint`)
- `#/` is `src/` (package.json `imports`). Import other files by their full path: `#/features/auth/schema`.
- `src/shared/` never imports features{{#server}} or `src/server/`{{/server}}{{#hono}} (one exception: the RPC client's server-rendering branch){{/hono}}.
{{#server}}
- `components/`, `hooks/` and `src/routes/` (except `routes/api/`) never import `src/server/` or a feature's `server/`.
- `src/server/` imports features only in `api/hono/app.ts` (routes) and `db/drizzle/tables.ts` (tables).
{{/server}}

{{#server}}
## How the pieces connect
{{#hono}}
- **Data:** component or loader → `hooks/use-<thing>.ts` → `getApi()` (RPC client) → `server/routes.ts` →
  `server/service.ts`. During server rendering the client calls Hono in-process with the visitor's cookie.
{{/hono}}
{{^hono}}
- **Data:** loader or hook → `functions.ts` (server function) → `server/service.ts`.
{{/hono}}
{{#db}}
- **Database:** get it once per request and pass it on: `dbMiddleware` gives server functions `context.db`.
{{#hono}}
  `withDb` gives Hono routes `c.var.db`.
{{/hono}}
  Services take `db` first, so tests pass `createTestDb()`.
{{/db}}
{{#auth}}
- **Auth:** `_private/route.tsx` guards pages with `getSession`. Server functions add `authMiddleware`{{#hono}}; API routes add `requireAuth`{{/hono}}.
  A route guard alone protects nothing.
{{/auth}}
- **Env:** `getEnv()` inside a handler or function, never at module load{{#cloudflare}}. Bindings come from `cloudflare:workers`{{/cloudflare}}.
  Never put a secret in a `VITE_*` variable (Vite ships those to browsers).
{{/server}}
