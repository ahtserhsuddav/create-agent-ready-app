import type { Metadata } from 'next'
import { SignUpCard } from '#/features/auth/components/sign-up-card'

export const metadata: Metadata = { title: 'Create your account' }

export default function SignUpPage() {
  return <SignUpCard redirectTo="/dashboard" />
}
