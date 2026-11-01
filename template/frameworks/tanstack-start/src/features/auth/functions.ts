import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { getAuth } from '#/server/auth/better-auth/setup'

// The signed-in user's session, or null, for route guards (beforeLoad) and loaders (Better Auth's TanStack Start
// guide). It runs on the server; the browser calls it over RPC.
export const getSession = createServerFn({ method: 'GET' }).handler(async () => {
  const auth = await getAuth()
  return auth.api.getSession({ headers: getRequestHeaders() })
})
