// {{#next}}
'use client'

// {{/next}}
import { useSelector } from '@tanstack/react-form'
import type { ComponentProps } from 'react'
// {{#shadcn}}
import { Field, FieldError, FieldLabel } from '#/shared/components/ui/field'
import { Input } from '#/shared/components/ui/input'
// {{/shadcn}}
import { useFieldContext } from '#/shared/lib/tanstack/form-context'

type TextFieldProps = Omit<
  ComponentProps<'input'>,
  'id' | 'name' | 'value' | 'onChange' | 'onBlur' | 'aria-invalid'
> & { label: string }

// A labelled text input for form.AppField. Pass autoComplete (email, name…) so browsers can fill it in.
// Errors show once the field has been touched.
export function TextField({ label, ...props }: TextFieldProps) {
  const field = useFieldContext<string>()
  const errors = useSelector(field.store, (state) => state.meta.errors)
  const touched = useSelector(field.store, (state) => state.meta.isTouched)
  const invalid = touched && errors.length > 0
  // {{#shadcn}}
  return (
    <Field data-invalid={invalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Input
        {...props}
        id={field.name}
        name={field.name}
        value={field.state.value}
        onChange={(event) => field.handleChange(event.target.value)}
        onBlur={field.handleBlur}
        aria-invalid={invalid}
      />
      {invalid && <FieldError errors={errors} />}
    </Field>
  )
  // {{/shadcn}}
  // {{^shadcn}}
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={field.name} className="text-sm font-medium">
        {label}
      </label>
      <input
        {...props}
        id={field.name}
        name={field.name}
        value={field.state.value}
        onChange={(event) => field.handleChange(event.target.value)}
        onBlur={field.handleBlur}
        aria-invalid={invalid}
        aria-describedby={invalid ? `${field.name}-error` : undefined}
        className="rounded-md border px-3 py-2"
      />
      {invalid && (
        <p id={`${field.name}-error`} role="alert" className="text-sm text-red-600">
          {errors.map((error) => error?.message).join(', ')}
        </p>
      )}
    </div>
  )
  // {{/shadcn}}
}
