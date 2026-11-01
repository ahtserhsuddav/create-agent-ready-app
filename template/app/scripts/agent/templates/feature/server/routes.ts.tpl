import { Hono } from 'hono'
import { new__Item__Schema } from '#/features/__name__/schema'
import { create__Item__, list__Name__ } from '#/features/__name__/server/service'
import { validate, withDb } from '#/server/api/hono/middleware'
import type { Db } from '#/server/db/drizzle/client'

// The /api/__name__ endpoints. The UI calls them through the typed RPC client (hooks/use-__name__.ts).
// For signed-in users only, add requireAuth from #/server/api/hono/middleware.
export const __camel__Routes = new Hono<{ Variables: { db: Db } }>()
  .use(withDb)
  .get('/', async (c) => c.json(await list__Name__(c.var.db), 200))
  .post('/', validate('json', new__Item__Schema), async (c) =>
    c.json(await create__Item__(c.var.db, c.req.valid('json')), 201),
  )
