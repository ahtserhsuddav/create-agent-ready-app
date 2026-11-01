import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { type ReactNode, Suspense } from 'react'
// {{#seo}}
import { site } from '#/features/seo/content'
// {{/seo}}
import { getSession } from '#/server/auth/better-auth/session'

export const metadata: Metadata = { robots: { index: false } }

// The layout of the sign-in pages. Signed-in visitors skip them and go to the dashboard. The session is read inside
// <Suspense> (Cache Components), so the rest of the page can still be prerendered.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 p-6">
      <Link href="/" className="text-center text-xl font-semibold">
        {{#seo}}{site.name}{{/seo}}{{^seo}}{{name}}{{/seo}}
      </Link>
      <Suspense fallback={null}>
        <SignedOutOnly>{children}</SignedOutOnly>
      </Suspense>
    </main>
  )
}

async function SignedOutOnly({ children }: { children: ReactNode }) {
  if (await getSession()) redirect('/dashboard')
  return children
}
