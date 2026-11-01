import { createFileRoute{{#auth-pages}}, Link{{/auth-pages}} } from '@tanstack/react-router'
// {{#seo}}
import { site } from '#/features/seo/content'
import { pageHead } from '#/features/seo/page-head'
import { organizationJsonLd, websiteJsonLd } from '#/features/seo/structured-data'
// {{/seo}}

export const Route = createFileRoute('/')({
  // {{#seo}}
  head: () =>
    pageHead({
      title: site.name,
      description: site.description,
      path: '/',
      jsonLd: [organizationJsonLd(), websiteJsonLd()],
    }),
  // {{/seo}}
  component: HomePage,
})

// A placeholder until the design pass: the website-design skill turns design/DESIGN.md into this page.
function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 p-8">
      <h1 className="text-4xl font-bold">{{#seo}}{site.name}{{/seo}}{{^seo}}{{name}}{{/seo}}</h1>
      <p className="text-lg opacity-75">Design this page with the website-design skill (design/DESIGN.md).</p>
      {{#auth-pages}}
      <Link to="/sign-in" className="font-medium underline underline-offset-4">
        Sign in
      </Link>
      {{/auth-pages}}
    </main>
  )
}
