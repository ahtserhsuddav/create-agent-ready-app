import type { Metadata } from 'next'
import type { ReactNode } from 'react'
// {{#seo}}
import { site } from '#/features/seo/content'
// {{/seo}}
// {{#shadcn}}
import { Toaster } from '#/shared/components/ui/sonner'
// {{/shadcn}}
// {{#query}}
import { QueryProvider } from '#/shared/lib/tanstack/query-provider'
// {{/query}}
import './globals.css'

export const metadata: Metadata = {
  // {{#seo}}
  metadataBase: new URL(site.url),
  title: { default: site.name, template: `%s · ${site.name}` },
  description: site.description,
  // {{/seo}}
  // {{^seo}}
  title: '{{name}}',
  // {{/seo}}
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang={{#seo}}{site.locale}{{/seo}}{{^seo}}"en"{{/seo}}>
      <body className="min-h-screen antialiased">
        {{#query}}
        <QueryProvider>{children}</QueryProvider>
        {{/query}}
        {{^query}}
        {children}
        {{/query}}
        {{#shadcn}}
        <Toaster position="top-center" />
        {{/shadcn}}
      </body>
    </html>
  )
}
