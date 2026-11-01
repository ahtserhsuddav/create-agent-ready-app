import { createFileRoute } from '@tanstack/react-router'
import { getAuth } from '#/server/auth/better-auth/setup'

// Better Auth's endpoints at /api/auth/*, mounted as its TanStack Start guide shows.
export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: async ({ request }) => (await getAuth()).handler(request),
      POST: async ({ request }) => (await getAuth()).handler(request),
    },
  },
})
