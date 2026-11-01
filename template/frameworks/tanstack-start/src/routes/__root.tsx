import { TanStackDevtools } from '@tanstack/react-devtools'
// {{#query}}
import type { QueryClient } from '@tanstack/react-query'
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools'
// {{/query}}
import { {{#query}}createRootRouteWithContext{{/query}}{{^query}}createRootRoute{{/query}}, HeadContent, Scripts } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
// {{#seo}}
import { site } from '#/features/seo/content'
// {{/seo}}
// {{#shadcn}}
import { Toaster } from '#/shared/components/ui/sonner'
// {{/shadcn}}
import appCss from '../styles.css?url'

export const Route = {{#query}}createRootRouteWithContext<{ queryClient: QueryClient }>(){{/query}}{{^query}}createRootRoute{{/query}}({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: {{#seo}}site.name{{/seo}}{{^seo}}'{{name}}'{{/seo}} },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang={{#seo}}{site.locale}{{/seo}}{{^seo}}"en"{{/seo}}>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        {{#shadcn}}
        <Toaster position="top-center" />
        {{/shadcn}}
        <TanStackDevtools
          config={{ position: 'bottom-right' }}
          plugins={[
            { name: 'TanStack Router', render: <TanStackRouterDevtoolsPanel /> },
            {{#query}}
            { name: 'TanStack Query', render: <ReactQueryDevtoolsPanel /> },
            {{/query}}
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
