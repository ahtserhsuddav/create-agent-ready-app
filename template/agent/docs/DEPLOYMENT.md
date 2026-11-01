# DEPLOYMENT — how this project reaches production. Keep it short and current.

## Environments
| Env | URL | Deploys from |
| --- | --- | --- |
| Preview | (fill in) | every pushed branch |
| Production | (fill in) | `main` |

## How a deploy runs
- Always first: skill `release` (checks, backup, migrations, the human's yes).
{{#cloudflare}}
- Cloudflare Workers Builds: connect the repo in the Cloudflare dashboard; build `{{run}} build`, deploy
  `{{exec}} wrangler deploy`. Pushing to `main` deploys; branches get preview URLs. Manual, after a yes: `{{run}} deploy`.
  Wrangler commands and `wrangler.jsonc`: skill `wrangler`. Adding a Cloudflare product (R2, KV, Queues…): skill `cloudflare`.
{{/cloudflare}}
{{#vercel}}
- Vercel: import the repo in the Vercel dashboard (it detects {{framework}}). Pushing to `main` deploys; every branch
  gets a preview URL.
  Deploying from the terminal: skill `deploy-to-vercel`.
{{/vercel}}
{{#node}}
{{#tanstack-start}}
- Nitro builds a server into `.output/`: `{{run}} build`, then `{{run}} start` on the host (Railway, Render, a VPS or
  Docker).
{{/tanstack-start}}
{{#next}}
- `{{run}} build`, then `{{run}} start` on the host (Railway, Render, a VPS). For Docker, set `output: 'standalone'`
  in `next.config.ts` and follow Next.js's self-hosting guide.
{{/next}}
{{/node}}

## Secrets and variables (names only; values never in git)
{{#cloudflare}}
Set with `{{exec}} wrangler secret put <NAME>`; required ones are listed under `secrets` in `wrangler.jsonc`.
{{/cloudflare}}
{{^cloudflare}}
Set in the host's dashboard as environment variables{{#server-env}} (`src/server/config/env.ts` lists them){{/server-env}}.
{{/cloudflare}}
| Name | Used for |
| --- | --- |
{{#postgres}}
| `DATABASE_URL` | {{^cloudflare}}the app's Postgres connection and {{/cloudflare}}`drizzle-kit` migrations (local `.env`) |
{{/postgres}}
{{#cloudflare}}
{{#postgres}}
| `HYPERDRIVE` binding | the Worker's pooled Postgres connection (`hyperdrive` id in `wrangler.jsonc`) |
{{/postgres}}
{{#d1}}
| `DB` binding | the database (`d1_databases` in `wrangler.jsonc`) |
{{/d1}}
{{/cloudflare}}
{{#auth}}
| `BETTER_AUTH_SECRET` · `BETTER_AUTH_URL` | signing sessions · the site's public URL |
{{/auth}}
{{#email}}
| `EMAIL_FROM` · `EMAIL_FROM_NAME` · {{#resend}}`RESEND_API_KEY`{{/resend}}{{#zeptomail}}`ZEPTOMAIL_TOKEN`{{/zeptomail}} | sending email |
{{/email}}
{{^dotenv}}
| (none yet) | |
{{/dotenv}}

## First-time setup (each step needs the human's yes)
{{#cloudflare}}
- Cloudflare: the first deploy creates the Worker; add the custom domain; keep `observability` on.
{{#postgres}}
- Postgres host (Supabase, Neon…): create the database, then `{{exec}} wrangler hyperdrive create <name>
  --connection-string="<url>"` and put the id in `wrangler.jsonc`. On Supabase, leave RLS on (tables enable it).
{{/postgres}}
{{#d1}}
- D1: `{{exec}} wrangler d1 create <name>`, put the id in `wrangler.jsonc`, then `{{exec}} wrangler d1 migrations apply DB --remote`.
{{/d1}}
{{/cloudflare}}
{{^cloudflare}}
- Host: create the project, set the env vars above{{#postgres}}, and a Postgres database (Supabase, Neon, the host's own){{/postgres}}.
{{/cloudflare}}
{{#seo}}
- Search: add the site to Google Search Console and Bing Webmaster Tools; submit `/sitemap.xml`.
{{/seo}}
{{#db}}

## Migrations in production
Backup → `{{run}} db:migrate` against production → deploy code. Destructive changes: expand → migrate data → contract.
{{/db}}
