import { useMutation } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import type { SignInInput, SignUpInput } from '#/features/auth/schema'
import { authClient } from '#/shared/auth/better-auth/client'

// Sign-in, sign-up and sign-out as TanStack Query mutations: buttons get a pending state, errors become toasts (the
// query client), and afterwards the router reloads so route guards and loaders see the new session.

function useGoAfterAuth() {
  const router = useRouter()
  return async (href: string) => {
    await router.invalidate()
    await router.navigate({ href })
  }
}

export function useSignIn(redirectTo: string) {
  const goTo = useGoAfterAuth()
  return useMutation({
    mutationFn: async (input: SignInInput) => {
      const { error } = await authClient.signIn.email(input)
      if (error) throw error
    },
    onSuccess: () => goTo(redirectTo),
  })
}

export function useSignUp(redirectTo: string) {
  const goTo = useGoAfterAuth()
  return useMutation({
    mutationFn: async (input: SignUpInput) => {
      const { error } = await authClient.signUp.email(input)
      if (error) throw error
    },
    onSuccess: () => goTo(redirectTo),
    // {{#email}}
    meta: { successMessage: 'Account created. Check your inbox to confirm your email address.' },
    // {{/email}}
    // {{^email}}
    meta: { successMessage: 'Account created.' },
    // {{/email}}
  })
}
// {{#email}}

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: async (email: string) => {
      const { error } = await authClient.requestPasswordReset({ email, redirectTo: '/reset-password' })
      if (error) throw error
    },
    meta: { successMessage: 'If that address has an account, a reset link is on its way.' },
  })
}

export function useResetPassword() {
  const goTo = useGoAfterAuth()
  return useMutation({
    mutationFn: async (input: { newPassword: string; token: string }) => {
      const { error } = await authClient.resetPassword(input)
      if (error) throw error
    },
    onSuccess: () => goTo('/sign-in'),
    meta: { successMessage: 'Password changed. Sign in with the new one.' },
  })
}
// {{/email}}

export function useSignOut() {
  const goTo = useGoAfterAuth()
  return useMutation({
    mutationFn: async () => {
      const { error } = await authClient.signOut()
      if (error) throw error
    },
    onSuccess: () => goTo('/'),
  })
}
