// {{#cloudflare}}
// {{#tanstack-start}}
import { env } from 'cloudflare:workers'
// {{/tanstack-start}}
// {{#next}}
import { getCloudflareContext } from '@opennextjs/cloudflare'
// {{/next}}
// {{/cloudflare}}
// {{#postgres}}
import { drizzle } from 'drizzle-orm/node-postgres'
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core'
// {{/postgres}}
// {{#d1}}
import { drizzle } from 'drizzle-orm/d1'
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
// {{/d1}}
// {{#vercel}}
import { attachDatabasePool } from '@vercel/functions'
// {{/vercel}}
// {{#postgres}}
// {{#cloudflare}}
import { Client } from 'pg'
// {{/cloudflare}}
// {{^cloudflare}}
import { Pool } from 'pg'
// {{/cloudflare}}
// {{/postgres}}
// {{^cloudflare}}
import { getEnv } from '#/server/config/env'
// {{/cloudflare}}
import * as tables from '#/server/db/drizzle/tables'

// {{#postgres}}
// Any Postgres Drizzle database with the app's tables: the app's connection here, in-memory PGlite in tests.
export type Db = PgDatabase<PgQueryResultHKT, typeof tables>
// {{/postgres}}
// {{#d1}}
// Any SQLite Drizzle database with the app's tables: D1 here, in-memory sql.js in tests.
export type Db = BaseSQLiteDatabase<'sync' | 'async', unknown, typeof tables>
// {{/d1}}

// {{^cloudflare}}
let db: Db | undefined

// One connection pool for the whole server process, created on first use.
export async function getDb(): Promise<Db> {
  if (!db) {
    const pool = new Pool({ connectionString: getEnv().DATABASE_URL })
    // {{#vercel}}
    // Fluid compute: idle connections are released before a function suspends (Vercel's pool guide).
    attachDatabasePool(pool)
    // {{/vercel}}
    db = drizzle({ client: pool, schema: tables, casing: 'snake_case' })
  }
  return db
}
// {{/cloudflare}}
// {{#cloudflare}}
// {{#postgres}}
// Workers can't share a connection between requests, so each request opens its own client; Hyperdrive pools the
// real connections. Get it once per request (dbMiddleware, withDb) and pass it on.
export async function getDb(): Promise<Db> {
  // {{#next}}
  const { env } = getCloudflareContext()
  // {{/next}}
  const client = new Client({ connectionString: env.HYPERDRIVE.connectionString })
  await client.connect()
  return drizzle(client, { schema: tables, casing: 'snake_case' })
}
// {{/postgres}}
// {{#d1}}
// The D1 binding from wrangler.jsonc. Get it once per request (dbMiddleware, withDb) and pass it on.
export async function getDb(): Promise<Db> {
  // {{#next}}
  const { env } = getCloudflareContext()
  // {{/next}}
  return drizzle(env.DB, { schema: tables, casing: 'snake_case' })
}
// {{/d1}}
// {{/cloudflare}}
