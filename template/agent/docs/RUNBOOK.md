# RUNBOOK — what to do when production breaks. Short steps; ask the human before any production command.

## Roll back the code
{{#cloudflare}}
`{{exec}} wrangler deployments list` → `{{exec}} wrangler rollback <version-id>`. Rolls back code only, never data. Skill `wrangler` has the exact flags.
{{/cloudflare}}
{{^cloudflare}}
Redeploy the previous good commit from the host's dashboard (or `git revert` and push). Code only, never data.
{{/cloudflare}}

## Read the logs
{{#cloudflare}}
Live: `{{exec}} wrangler tail` · history: Cloudflare dashboard → Workers → your Worker → Observability.
{{/cloudflare}}
{{^cloudflare}}
The host's log view (Railway, Render…), or the server's stdout.
{{/cloudflare}}
{{#db}}

## Restore the database
{{#postgres}}
Your Postgres host's backups or point-in-time recovery (Supabase, Neon). Unsure? Restore into a new database first.
{{/postgres}}
{{#d1}}
`{{exec}} wrangler d1 time-travel info DB`, then `{{exec}} wrangler d1 time-travel restore DB --timestamp=<time>`.
{{/d1}}
{{/db}}

## Common incidents
| Symptom | Check first |
| --- | --- |
| Every page errors | The latest deploy: roll back, then read the logs |
{{#auth}}
| Sign-in fails, no session cookie | `BETTER_AUTH_URL` = the site's URL, HTTPS, `BETTER_AUTH_SECRET` set |
{{/auth}}
{{#postgres}}
| Database timeouts | The host's status page, connection limits{{#cloudflare}}, the Hyperdrive config{{/cloudflare}} |
{{/postgres}}
{{#seo}}
| Pages missing from search or AI answers | `/robots.txt`, `/sitemap.xml` in Search Console and Bing{{#cloudflare}}, AI Crawl Control{{/cloudflare}} |
{{/seo}}

## Contacts
- Owner: (fill in) · Hosting account: (fill in)
