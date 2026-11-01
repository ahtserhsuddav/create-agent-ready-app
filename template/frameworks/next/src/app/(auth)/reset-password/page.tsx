import type { Metadata } from 'next'
import { ResetPasswordCard } from '#/features/auth/components/reset-password-card'

export const metadata: Metadata = { title: 'Choose a new password' }

// Better Auth sends people here from the reset email with ?token=, or ?error= when the link no longer works.
export default async function ResetPasswordPage({ searchParams }: PageProps<'/reset-password'>) {
  const { token, error } = await searchParams
  return <ResetPasswordCard token={error || typeof token !== 'string' ? undefined : token} />
}
