// {{#db}}
import { DrizzleQueryError } from 'drizzle-orm'
// {{/db}}
import type { ErrorHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { AppError } from '#/shared/error/app-error'

// Turns anything thrown in a route into an ErrorResponse (src/shared/error/types.ts). Expected failures (AppError)
// keep their status and message; anything else is logged and returned as a generic 500, so no internals leak.
export const errorHandler: ErrorHandler = (error, c) => {
  const appError = toAppError(error)
  if (appError.code === 'SERVER_ERROR') console.error(error)
  return c.json(appError.toResponse(), appError.status as ContentfulStatusCode)
}

function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error
  if (error instanceof HTTPException) {
    if (error.status === 401) return new AppError('UNAUTHORIZED')
    if (error.status === 403) return new AppError('FORBIDDEN')
    if (error.status === 404) return new AppError('NOT_FOUND')
    if (error.status === 413 || error.status === 400) return new AppError('BAD_REQUEST')
  }
  // {{#db}}
  // Drizzle wraps the driver's error; its code says what the database refused.
  const cause = error instanceof DrizzleQueryError ? error.cause : undefined
  const code = (cause as { code?: unknown } | undefined)?.code
  if (code === '23505' || code === 'SQLITE_CONSTRAINT_UNIQUE') return new AppError('CONFLICT')
  if (code === '23503' || code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    return new AppError('BAD_REQUEST', 'A referenced record does not exist.')
  }
  // {{/db}}
  return new AppError('SERVER_ERROR')
}
