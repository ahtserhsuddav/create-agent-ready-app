import type { Metadata } from 'next'
import { SignInCard } from '#/features/auth/components/sign-in-card'
import { safeRedirect } from '#/features/auth/safe-redirect'

export const metadata: Metadata = { title: 'Sign in' }

// ?redirect= is the page to return to after signing in.
export default async function SignInPage({ searchParams }: PageProps<'/sign-in'>) {
  const { redirect } = await searchParams
  return <SignInCard redirectTo={safeRedirect(typeof redirect === 'string' ? redirect : undefined)} />
}
