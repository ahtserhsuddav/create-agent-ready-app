import { {{#shadcn}}MutationCache, QueryCache, {{/shadcn}}QueryClient } from '@tanstack/react-query'
// {{#shadcn}}
import { toast } from '#/shared/components/toast/toast'
// {{/shadcn}}

// One QueryClient per request ({{#tanstack-start}}src/router.tsx{{/tanstack-start}}{{#next}}query-provider.tsx{{/next}}).
// {{#shadcn}}
// Mutations toast their meta.successMessage; failures toast unless meta.silent is set. Validation (422) and
// conflict (409) errors are left to the form, which shows them on its fields.
// {{/shadcn}}
export function newQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { staleTime: 60 * 1000 } },
    // {{#shadcn}}
    mutationCache: new MutationCache({
      onSuccess: (_data, _variables, _onMutateResult, mutation) => {
        if (mutation.meta?.successMessage) {
          toast.success({ title: 'Done', description: mutation.meta.successMessage })
        }
      },
      onError: (error, _variables, _onMutateResult, mutation) => {
        if (mutation.meta?.silent) return
        const { status, message } = describeError(error)
        if (status === 422 || status === 409) return
        toast.error({ title: 'Something went wrong', description: message })
      },
    }),
    queryCache: new QueryCache({
      onError: (error, query) => {
        if (query.meta?.silent) return
        const { status, message } = describeError(error)
        if (status >= 500) toast.error({ title: 'Could not load data', description: message })
      },
    }),
    // {{/shadcn}}
  })
}
// {{#shadcn}}

// Better Auth errors carry status and message. Hono's parseResponse throws statusCode, with the API's ErrorResponse
// in detail.data. Other errors only have a message.
function describeError(error: unknown) {
  const { status, statusCode, message, detail } = (error ?? {}) as {
    status?: unknown
    statusCode?: unknown
    message?: unknown
    detail?: { data?: { message?: unknown } }
  }
  const apiMessage = detail?.data?.message
  return {
    status: typeof status === 'number' ? status : typeof statusCode === 'number' ? statusCode : 500,
    message:
      typeof apiMessage === 'string'
        ? apiMessage
        : typeof message === 'string' && message
          ? message
          : 'Please try again later.',
  }
}

declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: { silent?: boolean; successMessage?: string }
    queryMeta: { silent?: boolean }
  }
}
// {{/shadcn}}
