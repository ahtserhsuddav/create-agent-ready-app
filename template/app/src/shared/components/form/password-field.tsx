// {{#next}}
'use client'

// {{/next}}
import { useSelector } from '@tanstack/react-form'
import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { type ComponentProps, useState } from 'react'
// {{#shadcn}}
import { Field, FieldError, FieldLabel } from '#/shared/components/ui/field'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '#/shared/components/ui/input-group'
// {{/shadcn}}
import { useFieldContext } from '#/shared/lib/tanstack/form-context'

type PasswordFieldProps = Omit<
  ComponentProps<'input'>,
  'id' | 'name' | 'type' | 'value' | 'onChange' | 'onBlur' | 'aria-invalid'
> & { label: string }

// A password input with a show/hide button. Use autoComplete="current-password" to sign in and "new-password"
// to sign up, so password managers fill and save it.
export function PasswordField({ label, ...props }: PasswordFieldProps) {
  const field = useFieldContext<string>()
  const errors = useSelector(field.store, (state) => state.meta.errors)
  const touched = useSelector(field.store, (state) => state.meta.isTouched)
  const [visible, setVisible] = useState(false)
  const invalid = touched && errors.length > 0
  const Icon = visible ? EyeOffIcon : EyeIcon
  // {{#shadcn}}
  return (
    <Field data-invalid={invalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <InputGroup>
        <InputGroupInput
          {...props}
          id={field.name}
          name={field.name}
          type={visible ? 'text' : 'password'}
          value={field.state.value}
          onChange={(event) => field.handleChange(event.target.value)}
          onBlur={field.handleBlur}
          aria-invalid={invalid}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-xs"
            aria-label={visible ? 'Hide password' : 'Show password'}
            aria-pressed={visible}
            onClick={() => setVisible((shown) => !shown)}
          >
            <Icon />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
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
      <div className="flex items-center rounded-md border">
        <input
          {...props}
          id={field.name}
          name={field.name}
          type={visible ? 'text' : 'password'}
          value={field.state.value}
          onChange={(event) => field.handleChange(event.target.value)}
          onBlur={field.handleBlur}
          aria-invalid={invalid}
          aria-describedby={invalid ? `${field.name}-error` : undefined}
          className="flex-1 bg-transparent px-3 py-2"
        />
        <button
          type="button"
          className="px-3"
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          onClick={() => setVisible((shown) => !shown)}
        >
          <Icon aria-hidden className="size-4" />
        </button>
      </div>
      {invalid && (
        <p id={`${field.name}-error`} role="alert" className="text-sm text-red-600">
          {errors.map((error) => error?.message).join(', ')}
        </p>
      )}
    </div>
  )
  // {{/shadcn}}
}
