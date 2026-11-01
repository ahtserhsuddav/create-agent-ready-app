// {{#next}}
'use client'

// {{/next}}
import { useSignUp } from '#/features/auth/hooks/use-auth'
import { signUpSchema } from '#/features/auth/schema'
import { useAppForm } from '#/shared/lib/tanstack/form-hook'

// Name, email and password sign-up. An email that already has an account shows on the email field, returned from
// onSubmitAsync (TanStack Form's way to show server errors); other failures show as toasts.
export function SignUpForm({ redirectTo }: { redirectTo: string }) {
  const signUp = useSignUp(redirectTo)
  const form = useAppForm({
    defaultValues: { name: '', email: '', password: '' },
    validators: {
      onChange: signUpSchema,
      onSubmitAsync: async ({ value }) => {
        try {
          await signUp.mutateAsync(value)
        } catch (error) {
          if (String((error as { code?: unknown }).code).startsWith('USER_ALREADY_EXISTS')) {
            return { fields: { email: 'This email already has an account. Sign in instead.' } }
          }
        }
        return null
      },
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
      <form.AppField name="name">
        {(field) => <field.TextField label="Name" autoComplete="name" />}
      </form.AppField>
      <form.AppField name="email">
        {(field) => <field.TextField label="Email" type="email" autoComplete="email" />}
      </form.AppField>
      <form.AppField name="password">
        {(field) => <field.PasswordField label="Password" autoComplete="new-password" />}
      </form.AppField>
      <form.AppForm>
        <form.SubmitButton label="Create account" pendingLabel="Creating account…" />
      </form.AppForm>
    </form>
  )
}
