// {{#next}}
'use client'

// {{/next}}
import { createFormHook } from '@tanstack/react-form'
import { PasswordField } from '#/shared/components/form/password-field'
import { SubmitButton } from '#/shared/components/form/submit-button'
import { TextField } from '#/shared/components/form/text-field'
import { fieldContext, formContext } from '#/shared/lib/tanstack/form-context'

// useAppForm is useForm with the project's fields built in:
// <form.AppField name="email" children={(field) => <field.TextField label="Email" autoComplete="email" />} />
// Validators take Zod schemas directly; server errors come back from validators.onSubmitAsync as { fields }.
/** @public */
export const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { TextField, PasswordField },
  formComponents: { SubmitButton },
})
