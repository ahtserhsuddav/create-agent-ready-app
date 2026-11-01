import { desc } from 'drizzle-orm'
import type { New__Item__ } from '#/features/__name__/schema'
import { __camel__ } from '#/features/__name__/server/tables'
import type { Db } from '#/server/db/drizzle/client'

// Business rules and queries for __name__: the one place this logic lives. Each function takes the request's
// database first, so {{#hono}}routes{{/hono}}{{^hono}}server functions{{/hono}} pass theirs and tests pass an in-memory one.
export function list__Name__(db: Db) {
  return db.select().from(__camel__).orderBy(desc(__camel__.createdAt))
}

export async function create__Item__(db: Db, input: New__Item__) {
  const [row] = await db.insert(__camel__).values(input).returning()
  return row
}
