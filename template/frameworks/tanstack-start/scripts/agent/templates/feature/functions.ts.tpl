import { createServerFn } from '@tanstack/react-start'
import { new__Item__Schema } from '#/features/__name__/schema'
import { create__Item__, list__Name__ } from '#/features/__name__/server/service'
import { dbMiddleware } from '#/server/db/drizzle/middleware'

// How pages read and write __name__ data. They run on the server; the browser gets a typed RPC call.
// For signed-in users only, add authMiddleware from #/server/auth/better-auth/middleware.
export const get__Name__ = createServerFn({ method: 'GET' })
  .middleware([dbMiddleware])
  .handler(({ context }) => list__Name__(context.db))

export const save__Item__ = createServerFn({ method: 'POST' })
  .middleware([dbMiddleware])
  .validator(new__Item__Schema)
  .handler(({ context, data }) => create__Item__(context.db, data))
