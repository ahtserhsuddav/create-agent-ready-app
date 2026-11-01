// {{#next}}
'use client'

// {{/next}}
import { useSelector } from '@tanstack/react-form'
// {{#shadcn}}
import { Button } from '#/shared/components/ui/button'
// {{/shadcn}}
import { useFormContext } from '#/shared/lib/tanstack/form-context'

// The form's submit button for <form.AppForm>: disabled, with a pending label, while the form submits.
export function SubmitButton({ label, pendingLabel = label }: { label: string; pendingLabel?: string }) {
  const form = useFormContext()
  const submitting = useSelector(form.store, (state) => state.isSubmitting)
  // {{#shadcn}}
  return (
    <Button type="submit" disabled={submitting} className="w-full">
      {submitting ? pendingLabel : label}
    </Button>
  )
  // {{/shadcn}}
  // {{^shadcn}}
  return (
    <button
      type="submit"
      disabled={submitting}
      className="w-full rounded-md border px-4 py-2 font-medium disabled:opacity-50"
    >
      {submitting ? pendingLabel : label}
    </button>
  )
  // {{/shadcn}}
}
