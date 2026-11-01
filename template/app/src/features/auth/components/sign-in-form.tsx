// {{#next}}
'use client'

// {{/next}}
import { useSignIn } from '#/features/auth/hooks/use-auth'
import { signInSchema } from '#/features/auth/schema'
import { useAppForm } from '#/shared/lib/tanstack/form-hook'

// Email and password sign-in. A wrong password shows as a toast (the query client); field errors show inline.
export function SignInForm({ redirectTo }: { redirectTo: string }) {
  const signIn = useSignIn(redirectTo)
  const form = useAppForm({
    defaultValues: { email: '', password: '' },
    validators: { onChange: signInSchema },
    onSubmit: async ({ value }) => {
      await signIn.mutateAsync(value).catch(() => undefined)
    },
  })

  return (
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
      <form.AppField name="password">
        {(field) => <field.PasswordField label="Password" autoComplete="current-password" />}
      </form.AppField>
      <form.AppForm>
        <form.SubmitButton label="Sign in" pendingLabel="Signing in…" />
      </form.AppForm>
    </form>
  )
}
