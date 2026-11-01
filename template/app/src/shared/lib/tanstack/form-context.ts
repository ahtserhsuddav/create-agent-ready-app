// {{#next}}
'use client'

// {{/next}}
import { createFormHookContexts } from '@tanstack/react-form'

// Shared by the field components and form-hook.ts (TanStack Form's form composition guide).
export const { fieldContext, formContext, useFieldContext, useFormContext } = createFormHookContexts()
