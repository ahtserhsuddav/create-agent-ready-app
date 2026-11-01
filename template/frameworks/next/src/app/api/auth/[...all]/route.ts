import { toNextJsHandler } from 'better-auth/next-js'
import { getAuth } from '#/server/auth/better-auth/setup'

// Better Auth's endpoints at /api/auth/* (sign-in, sign-up, sessions…), per Better Auth's Next.js guide.
export const { GET, POST } = toNextJsHandler(async (request: Request) => (await getAuth()).handler(request))
