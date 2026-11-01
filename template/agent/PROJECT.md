# PROJECT.md — what this project is, in short lines. Edit a line when a fact changes; history goes in CHANGELOG.md.

## What
- Name: {{name}} · Domain: (fill in) · Type: (e.g. SaaS, local business, portfolio; used by website-design)
- Purpose: (one line: who it's for and what they get)

## Stack (only what AGENTS.md doesn't say)
- Created with create-agent-ready-app {{kitVersion}} on {{date}} · add-ons: {{addOns}}
- Extra services: (e.g. R2 for uploads, an analytics tool)

## Features (one line each; keep in sync when adding or removing one)
{{#auth}}
- auth: sign-in, sessions and the signed-in pages (`src/features/auth`, {{#tanstack-start}}`src/routes/_private`{{/tanstack-start}}{{#next}}`src/app/(private)`{{/next}})
{{/auth}}
{{^auth}}
- (none yet)
{{/auth}}

## Environments
- Local: http://localhost:3000 · Preview: (fill in) · Production: (fill in)
- Env var names: {{#dotenv}}`.env.example`{{/dotenv}}{{^dotenv}}none yet{{/dotenv}} · deploys and secrets: `docs/DEPLOYMENT.md`

## Decisions (one line each: date · decision · why)
- {{date}} · {{framework}} on {{deploy}}, {{runtime}} with {{pm}} · chosen at create time
{{#hono}}
- {{date}} · The UI reads and writes data through Hono's typed RPC client · one API for the UI and outside callers
{{/hono}}
{{#seo}}
- {{date}} · AI crawlers: search and training bots allowed (`src/features/seo/content.ts`) · most visibility in AI answers
{{/seo}}

## Rules for agents (project-specific; add one line when an agent repeats a mistake)
- (none yet)
