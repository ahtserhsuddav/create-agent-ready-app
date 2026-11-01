import { createMiddleware } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { getAuth } from '#/server/auth/better-auth/setup'
import { AppError } from '#/shared/error/app-error'

// For server functions that need a signed-in user: .middleware([authMiddleware]) gives the handler context.user and
// context.session and rejects everyone else. A route guard alone doesn't protect a server function.
/** @public */
export const authMiddleware = createMiddleware({ type: 'function' }).server(async ({ next }) => {
  const auth = await getAuth()
  const session = await auth.api.getSession({ headers: getRequestHeaders() })
  if (!session) throw new AppError('UNAUTHORIZED')
  return next({ context: { user: session.user, session: session.session } })
})
