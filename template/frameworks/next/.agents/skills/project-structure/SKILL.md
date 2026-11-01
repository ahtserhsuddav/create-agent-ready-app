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
  app/                         URL → page (Next.js App Router). Thin: Server Components call features, components render
    layout.tsx  page.tsx       HTML shell and metadata · "/"   (pricing/page.tsx "/pricing" · blog/[slug]/page.tsx)
{{#hono}}
    api/[[...route]]/route.ts  every /api/* request → the Hono app
{{/hono}}
{{#auth}}
    api/auth/[...all]/route.ts Better Auth's endpoints · (private)/ signed-in pages{{#auth-pages}} · (auth)/ sign-in and sign-up{{/auth-pages}}
{{/auth}}
  features/<name>/             one business capability, named by its noun: billing, team-members, blog-posts
    components/<thing>.tsx     one component per file; components/ui/ for pieces only this feature uses
{{#query}}
    hooks/use-<thing>.ts       TanStack Query hooks for client components
{{/query}}
    schema.ts                  Zod schemas + inferred types (safe in the browser)
    content.ts                 page copy, links, image paths (no JSX)
{{#server}}
    actions.ts                 Server Actions ('use server'): client components call them like functions
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
    auth/better-auth/          setup.ts (getAuth) · options.ts · session.ts (getSession) · tables.ts (generated)
{{/auth}}
{{#db}}
    db/drizzle/                client.ts (getDb) · tables.ts (all tables) · test-client.ts · migrations/
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
| `actions.ts` · `routes.ts` · `service.ts` | Server Actions · Hono endpoints · business rules and queries |
| `content.ts` · `use-<thing>.ts` · `<thing>.tsx` | page copy · a hook · a component (`invoice-table.tsx` → `InvoiceTable`) |

- kebab-case files and folders. Never name a file after its folder (`server/…/server.ts`) or vaguely (`index.ts`,
  `utils.ts`, `helpers.ts`, `common/`, `misc/`). No barrel files. No default exports unless a framework needs one.
- One main export per file; split a file past about 250 lines. Create folders only when something goes in them.
- Types come from schemas and tables (`z.infer`, `typeof table.$inferSelect`).

## Where does it go?
| You're adding | Put it in |
| --- | --- |
| A page or URL | `src/app/<path>/page.tsx`, thin (a Server Component unless it needs the browser) |
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
| Data the UI reads or writes | Server Components call `server/service.ts`; client components call `features/<name>/actions.ts`{{#query}}, wrapped in `hooks/`{{/query}} |
{{/db}}
{{/hono}}

## Import rules (Biome enforces them: `{{run}} lint`)
- `#/` is `src/` (tsconfig `paths`). Import other files by their full path: `#/features/auth/schema`.
- `src/shared/` never imports features{{#server}} or `src/server/`{{/server}}{{#hono}} (one exception: the RPC client's `AppType` type){{/hono}}.
{{#server}}
- `components/` and `hooks/` (client code) never import `src/server/` or a feature's `server/`. Server Components in
  `src/app/` may: that's how pages read data.
- `src/server/` imports features only in `api/hono/app.ts` (routes) and `db/drizzle/tables.ts` (tables).
{{/server}}

{{#server}}
## How the pieces connect
{{#hono}}
- **Data:** a Server Component calls `server/service.ts` directly (with `getDb()`). A client component →
  `hooks/use-<thing>.ts` → `getApi()` (RPC client) → `server/routes.ts` → `server/service.ts`.
{{/hono}}
{{^hono}}
- **Data:** a Server Component calls `server/service.ts`; a client component → `actions.ts` (Server Action) → the service.
{{/hono}}
{{#db}}
- **Database:** `getDb()` once per request (a Server Component, Server Action or route), then pass it on.
{{#hono}}
  `withDb` gives Hono routes `c.var.db`.
{{/hono}}
  Services take `db` first, so tests pass `createTestDb()`.
{{/db}}
{{#auth}}
- **Auth:** `(private)/layout.tsx` guards pages with `getSession()`. Server Actions check it themselves{{#hono}}; API routes add `requireAuth`{{/hono}}.
  A layout guard alone protects nothing.
{{^cloudflare}}
- **Cache Components:** reading request data (`headers()`, `cookies()`, the session, `searchParams`) happens inside
  `<Suspense>`, so the rest of the page can be prerendered (the Next.js docs in `node_modules/next/dist/docs/`).
{{/cloudflare}}
{{#cloudflare}}
- **Cache Components** are off on Workers (`next.config.ts` says why); keep request reads inside `<Suspense>` anyway,
  so turning them on later is one line.
{{/cloudflare}}
{{/auth}}
- **Env:** `getEnv()` inside a handler or function, never at module load{{#cloudflare}}. Bindings come from `getCloudflareContext()`{{/cloudflare}}.
  Never put a secret in a `NEXT_PUBLIC_*` variable (Next.js ships those to browsers).
{{/server}}
