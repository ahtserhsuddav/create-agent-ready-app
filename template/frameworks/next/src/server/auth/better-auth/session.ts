import { headers } from 'next/headers'
import { cache } from 'react'
import { getAuth } from '#/server/auth/better-auth/setup'

// The signed-in user's session, or null, for Server Components and Server Actions (Better Auth's Next.js guide).
// cache() reads it once per request, however many components ask. The request comes first: with Cache Components,
// that's what keeps the rest (env, database) out of the build's prerender.
export const getSession = cache(async () => {
  const requestHeaders = await headers()
  const auth = await getAuth()
  return auth.api.getSession({ headers: requestHeaders })
})
