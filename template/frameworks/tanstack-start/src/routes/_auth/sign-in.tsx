import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { SignInCard } from '#/features/auth/components/sign-in-card'
import { safeRedirect } from '#/features/auth/safe-redirect'

// ?redirect= is the page to return to after signing in (the _private guard sets it).
export const Route = createFileRoute('/_auth/sign-in')({
  validateSearch: z.object({ redirect: z.string().optional() }),
  head: () => ({ meta: [{ title: 'Sign in' }] }),
  component: SignInPage,
})

function SignInPage() {
  const { redirect } = Route.useSearch()
  return <SignInCard redirectTo={safeRedirect(redirect)} />
}
