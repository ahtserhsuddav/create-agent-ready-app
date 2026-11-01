import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'
import { errorHandler } from '#/server/api/hono/error-handler'
import { AppError } from '#/shared/error/app-error'
// agent-ready:feature-imports

// The Hono app behind /api/* (src/routes/api/$.ts hands every request to it). Feature routes are chained onto it,
// which is how Hono's RPC client gets their types (Hono RPC docs): `{{run}} new:feature <name>` adds them.
export const app = new Hono().basePath('/api')

app.use(secureHeaders())
app.onError(errorHandler)
app.notFound((c) => c.json(new AppError('NOT_FOUND').toResponse(), 404))

const routes = app
  .get('/health', (c) => c.json({ ok: true }, 200))
  // agent-ready:feature-routes

// The API's types, for the RPC client in src/shared/api/hono/client.ts.
export type AppType = typeof routes
