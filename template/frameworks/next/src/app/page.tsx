// {{#auth-pages}}
import Link from 'next/link'
// {{/auth-pages}}
// {{#seo}}
import type { Metadata } from 'next'
import { site } from '#/features/seo/content'
import { JsonLd } from '#/features/seo/json-ld'
import { pageMetadata } from '#/features/seo/page-metadata'
import { organizationJsonLd, websiteJsonLd } from '#/features/seo/structured-data'

export const metadata: Metadata = {
  ...pageMetadata({ title: site.name, description: site.description, path: '/' }),
  title: { absolute: site.name },
}
// {{/seo}}

// A placeholder until the design pass: the website-design skill turns design/DESIGN.md into this page.
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 p-8">
      {{#seo}}
      <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
      {{/seo}}
      <h1 className="text-4xl font-bold">{{#seo}}{site.name}{{/seo}}{{^seo}}{{name}}{{/seo}}</h1>
      <p className="text-lg opacity-75">Design this page with the website-design skill (design/DESIGN.md).</p>
      {{#auth-pages}}
      <Link href="/sign-in" className="font-medium underline underline-offset-4">
        Sign in
      </Link>
      {{/auth-pages}}
    </main>
  )
}
