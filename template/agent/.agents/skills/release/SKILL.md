---
name: release
description: "Ships to production: the production gate (checks, build, e2e, audit), security and SEO review, {{#db}}migrations, {{/db}}deploy after the human’s yes, smoke test, changelog. Use when asked to release, deploy or go live."
---

# Release

The heavy checks run here and in CI, never after small changes. Every production step needs the human's yes.

## Steps
1. **Clean start:** the work is merged to `main` (or the release branch), `git status` is clean and CI is green.
2. **Production gate:** `{{run}} release:check` (check, build, end-to-end tests if `test:e2e` exists, `{{audit}}`).
   Fix only what blocks the release: no refactors now.
3. **Reviews:** skill `security` → `references/review.md` on the changes since the last release
   (`git log` since the last "Released" line in CHANGELOG.md).
{{#seo}}
   Skill `seo-aeo` → "Check and measure" for new or changed public pages.
{{/seo}}
4. **Ask once**, in one short question: what will run ({{#db}}which migrations, {{/db}}deploy target), where (production) and how to
   undo it ({{#cloudflare}}`{{exec}} wrangler rollback`{{/cloudflare}}{{^cloudflare}}redeploying the previous commit{{/cloudflare}}{{#db}} plus the backup{{/db}}).
{{#db}}
5. **Database:** backup, then apply migrations (skill `database-change` → Production).
{{/db}}
6. **Deploy** the way docs/DEPLOYMENT.md says{{#cloudflare}} (push to `main` with Workers Builds, or `{{run}} deploy`){{/cloudflare}}.
7. **Smoke test** the production URL: the home page and one key page return 200 with the right content.
   {{#seo}}`/robots.txt`, `/sitemap.xml` and `/llms.txt` load. {{/seo}}{{#hono}}`/api/health` returns `{ ok: true }`. {{/hono}}{{#auth}}`/api/auth/ok` returns 200.{{/auth}}
8. **Record it:** `{{run}} log "Released: <one-line summary>" --by <agent>`. Ask before tagging or pushing a tag.

## If something breaks
Roll back first, investigate second: docs/RUNBOOK.md.

## First release of a project
Also work through docs/DEPLOYMENT.md → First-time setup.
{{#seo}}
Fill `site` in `src/features/seo/content.ts` with the real URL and description.
{{/seo}}
