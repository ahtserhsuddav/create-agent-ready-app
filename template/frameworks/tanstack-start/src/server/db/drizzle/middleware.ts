import { createMiddleware } from '@tanstack/react-start'
import { getDb } from '#/server/db/drizzle/client'

// For server functions that use the database: .middleware([dbMiddleware]) gives the handler context.db.
// Start removes the .server() code from the browser build, so functions.ts files can import this safely.
/** @public */
export const dbMiddleware = createMiddleware({ type: 'function' }).server(async ({ next }) =>
  next({ context: { db: await getDb() } }),
)
