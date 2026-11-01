// {{#runtime-node}}
import { existsSync } from 'node:fs'
// {{/runtime-node}}
import { defineConfig } from 'drizzle-kit'

// {{#runtime-node}}
// Node doesn't load .env by itself (Bun does), and drizzle-kit needs DATABASE_URL to migrate.
if (existsSync('.env')) process.loadEnvFile('.env')

// {{/runtime-node}}
// `{{run}} db:generate` writes SQL migrations from every tables.ts; `{{run}} db:migrate` applies them.
export default defineConfig({
  // {{#postgres}}
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL ?? '' },
  // {{/postgres}}
  // {{#d1}}
  dialect: 'sqlite',
  // {{/d1}}
  schema: ['./src/features/*/server/tables.ts'{{#auth}}, './src/server/auth/better-auth/tables.ts'{{/auth}}],
  out: './src/server/db/drizzle/migrations',
  casing: 'snake_case',
})
