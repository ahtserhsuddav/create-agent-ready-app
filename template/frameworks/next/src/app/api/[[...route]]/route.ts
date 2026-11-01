import { handle } from '@hono/vercel'
import { app } from '#/server/api/hono/app'

// Every /api/* request goes to the Hono app (Hono's Next.js guide).{{#auth}} /api/auth/* has its own route (api/auth/[...all]).{{/auth}}
const handler = handle(app)

export { handler as DELETE, handler as GET, handler as PATCH, handler as POST, handler as PUT }
