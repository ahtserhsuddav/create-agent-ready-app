'use client'

import Link from 'next/link'
import { useResetPassword } from '#/features/auth/hooks/use-auth'
import { resetPasswordSchema } from '#/features/auth/schema'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '#/shared/components/ui/card'
import { useAppForm } from '#/shared/lib/tanstack/form-hook'

// The page the reset email links to: Better Auth adds ?token= (or ?error=INVALID_TOKEN when the link is old or used).
export function ResetPasswordCard({ token }: { token?: string }) {
  const reset = useResetPassword()
  const form = useAppForm({
    defaultValues: { password: '' },
    validators: { onChange: resetPasswordSchema },
    onSubmit: async ({ value }) => {
      if (token) await reset.mutateAsync({ newPassword: value.password, token }).catch(() => undefined)
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose a new password</CardTitle>
        <CardDescription>
          {token ? 'Use at least 8 characters.' : 'This link has expired or was already used.'}
        </CardDescription>
      </CardHeader>
      {token ? (
        <CardContent>
          <form
            noValidate
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault()
              form.handleSubmit()
            }}
          >
            <form.AppField name="password">
              {(field) => <field.PasswordField label="New password" autoComplete="new-password" />}
            </form.AppField>
            <form.AppForm>
              <form.SubmitButton label="Change password" pendingLabel="Changing…" />
            </form.AppForm>
          </form>
        </CardContent>
      ) : null}
      <CardFooter className="justify-center text-sm">
        <Link href={token ? '/sign-in' : '/forgot-password'} className="font-medium underline underline-offset-4">
          {token ? 'Back to sign in' : 'Send a new link'}
        </Link>
      </CardFooter>
    </Card>
  )
}
