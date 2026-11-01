import { createFileRoute } from '@tanstack/react-router'
import { app } from '#/server/api/hono/app'

// Every /api/* request, any method, goes to the Hono app.{{#auth}} /api/auth/* has its own route (api/auth/$.ts).{{/auth}}
export const Route = createFileRoute('/api/$')({
  server: {
    handlers: {
      ANY: ({ request }) => app.fetch(request),
    },
  },
})
