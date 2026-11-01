---
name: database-change
description: "Database changes with Drizzle: tables, columns, indexes, migrations and data fixes, applied locally or in production. Use for any tables.ts, migration or data change in {{db}}."
---

# Database change (Drizzle · {{db}})

A Guarded change: follow `big-change`, and ask once before anything that writes to a database that isn't local.

## The flow
1. Edit the table in `src/features/<name>/server/tables.ts`. Column names are camelCase in TypeScript and
   snake_case in SQL (`casing: "snake_case"`). A new tables.ts is re-exported from `src/server/db/drizzle/tables.ts`
   (`{{run}} new:feature` does it for you).
2. `{{run}} db:generate` writes a migration to `src/server/db/drizzle/migrations/`. Read the SQL and check it does only
   what you meant.
{{#postgres}}
3. Apply it to your local database: `{{run}} db:migrate` (uses `DATABASE_URL` from `.env`; `docker compose up -d`
   starts the local one). Ask first if that database isn't yours alone.
{{/postgres}}
{{#d1}}
3. Apply it locally: `{{run}} db:migrate` (`wrangler d1 migrations apply DB --local`).
{{/d1}}
4. Update the service and its test: `{{run}} test src/features/<name>` runs against a fresh in-memory database with
   every migration applied (`createTestDb()` from `#/server/db/drizzle/test-client`).

## Rules
- Never edit or delete a migration that has been applied anywhere shared. Fix forward with a new migration.
- Never hand-write SQL that Drizzle can generate. A data fix goes in its own reviewed migration
  (`{{exec}} drizzle-kit generate --custom --name <what>`).
- **Destructive changes** (drop or rename a column or table, change a type, add NOT NULL to existing data) take
  three steps across releases: expand (add the new column), migrate the data and the code, contract (remove the
  old one). Ask the human before the contract step.
- Every foreign key gets an index. Every query the app runs often should hit an index.
{{#postgres}}
- New tables keep `.enableRLS()`: harmless anywhere, and on Supabase it keeps the public Data API out. Follow the
  skill `supabase-postgres-best-practices` (from Supabase) for types, indexes and constraints.
{{/postgres}}
{{#d1}}
- D1 limits: ≤ 100 bound parameters per query, no interactive transactions (use `db.batch()`).
{{/d1}}
{{#auth}}
- Auth tables come from Better Auth (`src/server/auth/better-auth/tables.ts`, generated): after changing plugins in
  `src/server/auth/better-auth/options.ts`, run `{{run}} auth:generate`, then `{{run}} db:generate`.
{{/auth}}

## Production (the release skill, after the human's yes)
1. Backup first. {{#postgres}}Your Postgres host's backups or point-in-time recovery.{{/postgres}}{{#d1}}D1: note the time; Time Travel can restore to it.{{/d1}}
2. Apply the migrations{{#postgres}} with `DATABASE_URL` set to production for that one command{{/postgres}}{{#d1}}: `{{exec}} wrangler d1 migrations apply DB --remote`{{/d1}}.
3. Deploy the code that needs them. The code must work with both the old and the new schema while it rolls out.
4. Add a log line saying which migration ran where.
