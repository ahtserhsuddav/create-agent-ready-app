import { createFileRoute, redirect } from '@tanstack/react-router'
import { getSession } from '#/features/auth/functions'

// Every page under _private/ needs a signed-in user; the user is in the route context for the pages below.
// {{#auth-pages}}
// Visitors go to the sign-in page, which brings them back here afterwards.
// {{/auth-pages}}
// This guards pages only: server functions add authMiddleware and API routes add requireAuth themselves.
export const Route = createFileRoute('/_private')({
  beforeLoad: async ({{#auth-pages}}{ location }{{/auth-pages}}) => {
    const session = await getSession()
    if (!session) {
      // {{#auth-pages}}
      throw redirect({ to: '/sign-in', search: { redirect: location.href } })
      // {{/auth-pages}}
      // {{^auth-pages}}
      throw redirect({ to: '/' })
      // {{/auth-pages}}
    }
    return { user: session.user }
  },
})
