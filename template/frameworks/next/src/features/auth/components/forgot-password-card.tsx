'use client'

import Link from 'next/link'
import { useRequestPasswordReset } from '#/features/auth/hooks/use-auth'
import { forgotPasswordSchema } from '#/features/auth/schema'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '#/shared/components/ui/card'
import { useAppForm } from '#/shared/lib/tanstack/form-hook'

// Asks for the account's email and sends a reset link. The answer is the same whether or not the address has an
// account, so the form can't be used to find out who has one.
export function ForgotPasswordCard() {
  const request = useRequestPasswordReset()
  const form = useAppForm({
    defaultValues: { email: '' },
    validators: { onChange: forgotPasswordSchema },
    onSubmit: async ({ value }) => {
      await request.mutateAsync(value.email).catch(() => undefined)
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Forgot your password?</CardTitle>
        <CardDescription>We'll email you a link to choose a new one.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            form.handleSubmit()
          }}
        >
          <form.AppField name="email">
            {(field) => <field.TextField label="Email" type="email" autoComplete="email" />}
          </form.AppField>
          <form.AppForm>
            <form.SubmitButton label="Send reset link" pendingLabel="Sending…" />
          </form.AppForm>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm">
        <Link href="/sign-in" className="font-medium underline underline-offset-4">
          Back to sign in
        </Link>
      </CardFooter>
    </Card>
  )
}
