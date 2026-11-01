import { createRouter } from '@tanstack/react-router'
// {{#query}}
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import { newQueryClient } from '#/shared/lib/tanstack/query-client'
// {{/query}}
import { ErrorComponent, NotFoundComponent } from '#/shared/components/error/error'
import { routeTree } from './routeTree.gen'

// {{#query}}
// A new router and QueryClient for every request, as TanStack Router's SSR Query integration requires.
// {{/query}}
export function getRouter() {
  // {{#query}}
  const queryClient = newQueryClient()
  // {{/query}}
  const router = createRouter({
    routeTree,
    // {{#query}}
    context: { queryClient },
    // {{/query}}
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: ErrorComponent,
    defaultNotFoundComponent: NotFoundComponent,
  })
  // {{#query}}
  setupRouterSsrQueryIntegration({ router, queryClient })
  // {{/query}}
  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
