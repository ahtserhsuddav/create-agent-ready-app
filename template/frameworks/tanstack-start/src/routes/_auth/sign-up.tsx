import { createFileRoute } from '@tanstack/react-router'
import { SignUpCard } from '#/features/auth/components/sign-up-card'

export const Route = createFileRoute('/_auth/sign-up')({
  head: () => ({ meta: [{ title: 'Create your account' }] }),
  component: SignUpPage,
})

function SignUpPage() {
  return <SignUpCard redirectTo="/dashboard" />
}
