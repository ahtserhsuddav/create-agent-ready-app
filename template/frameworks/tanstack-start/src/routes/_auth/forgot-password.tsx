import { createFileRoute } from '@tanstack/react-router'
import { ForgotPasswordCard } from '#/features/auth/components/forgot-password-card'

export const Route = createFileRoute('/_auth/forgot-password')({
  head: () => ({ meta: [{ title: 'Forgot your password?' }] }),
  component: ForgotPasswordCard,
})
