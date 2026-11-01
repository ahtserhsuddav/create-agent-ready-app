import { zValidator } from '@hono/zod-validator'
import type { ValidationTargets } from 'hono'
// {{#hono-context}}
import { createMiddleware } from 'hono/factory'
// {{/hono-context}}
import type { ZodType } from 'zod'
// {{#auth}}
import { getAuth } from '#/server/auth/better-auth/setup'
// {{/auth}}
// {{#db}}
import { type Db, getDb } from '#/server/db/drizzle/client'
// {{/db}}
import { AppError } from '#/shared/error/app-error'

// Validates one part of the request (json, query, param, form…) with a Zod schema. A failure is a 422 ErrorResponse
// with a message per field, which forms show next to their fields. (The custom-hook pattern from @hono/zod-validator.)
/** @public */
export const validate = <Target extends keyof ValidationTargets, Schema extends ZodType>(
  target: Target,
  schema: Schema,
) =>
  zValidator(target, schema, (result) => {
    if (!result.success) {
      const details = Object.fromEntries(
        result.error.issues.map((issue) => [issue.path.join('.') || 'form', issue.message]),
      )
      throw new AppError('VALIDATION', undefined, details)
    }
  })
// {{#db}}

// Gives a route this request's database as c.var.db. Add it only to routes that query, so health checks and
// unknown routes never open a connection.
/** @public */
export const withDb = createMiddleware<{ Variables: { db: Db } }>(async (c, next) => {
  c.set('db', await getDb())
  await next()
})
// {{/db}}
// {{#auth}}

type AuthSession = Awaited<ReturnType<typeof getAuth>>['$Infer']['Session']

// Lets only signed-in users through and gives the route c.var.user and c.var.session (Better Auth's Hono guide).
// Everyone else gets a 401 ErrorResponse.
/** @public */
export const requireAuth = createMiddleware<{
  Variables: { user: AuthSession['user']; session: AuthSession['session'] }
}>(async (c, next) => {
  const auth = await getAuth()
  const result = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!result) throw new AppError('UNAUTHORIZED')
  c.set('user', result.user)
  c.set('session', result.session)
  await next()
})
// {{/auth}}
