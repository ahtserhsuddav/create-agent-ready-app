import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { ResetPasswordCard } from '#/features/auth/components/reset-password-card'

// Better Auth sends people here from the reset email with ?token=, or ?error= when the link no longer works.
export const Route = createFileRoute('/_auth/reset-password')({
  validateSearch: z.object({ token: z.string().optional(), error: z.string().optional() }),
  head: () => ({ meta: [{ title: 'Choose a new password' }] }),
  component: ResetPasswordPage,
})

function ResetPasswordPage() {
  const { token, error } = Route.useSearch()
  return <ResetPasswordCard token={error ? undefined : token} />
}
