import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { type ReactNode, Suspense } from 'react'
import { getSession } from '#/server/auth/better-auth/session'

export const metadata: Metadata = { robots: { index: false } }

// Every page under (private)/ needs a signed-in user{{#auth-pages}}; visitors go to the sign-in page{{/auth-pages}}. This guards pages
// only: Server Actions check getSession() and API routes add requireAuth themselves. The session is read inside
// <Suspense> (Cache Components), so the page shell can still be prerendered.
export default function PrivateLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <SignedIn>{children}</SignedIn>
    </Suspense>
  )
}

async function SignedIn({ children }: { children: ReactNode }) {
  if (!(await getSession())) redirect({{#auth-pages}}'/sign-in'{{/auth-pages}}{{^auth-pages}}'/'{{/auth-pages}})
  return children
}
