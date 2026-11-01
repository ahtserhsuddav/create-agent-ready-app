import type { Metadata } from 'next'
import { ForgotPasswordCard } from '#/features/auth/components/forgot-password-card'

export const metadata: Metadata = { title: 'Forgot your password?' }

export default function ForgotPasswordPage() {
  return <ForgotPasswordCard />
}
