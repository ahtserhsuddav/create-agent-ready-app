// {{#postgres}}
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'
// {{/postgres}}
// {{#d1}}
import { drizzle } from 'drizzle-orm/sql-js'
import { migrate } from 'drizzle-orm/sql-js/migrator'
import initSqlJs from 'sql.js'
// {{/d1}}
import type { Db } from '#/server/db/drizzle/client'
import * as tables from '#/server/db/drizzle/tables'

const migrationsFolder = 'src/server/db/drizzle/migrations'

// For tests only: a fresh in-memory database with every migration applied, so tests never touch a real one.
/** @public */
export async function createTestDb(): Promise<Db> {
  // {{#postgres}}
  const db = drizzle(new PGlite(), { schema: tables, casing: 'snake_case' })
  await migrate(db, { migrationsFolder })
  // {{/postgres}}
  // {{#d1}}
  const SQL = await initSqlJs()
  const db = drizzle(new SQL.Database(), { schema: tables, casing: 'snake_case' })
  migrate(db, { migrationsFolder })
  // {{/d1}}
  return db
}
