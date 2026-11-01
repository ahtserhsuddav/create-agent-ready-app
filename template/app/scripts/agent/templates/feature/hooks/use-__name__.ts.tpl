import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
// {{^hono}}
// {{#tanstack-start}}
import { useServerFn } from '@tanstack/react-start'
// {{/tanstack-start}}
// {{/hono}}
// {{#hono}}
import { parseResponse } from 'hono/client'
// {{/hono}}
// {{^hono}}
import { get__Name__, save__Item__ } from '#/features/__name__/{{#tanstack-start}}functions{{/tanstack-start}}{{#next}}actions{{/next}}'
// {{/hono}}
import type { New__Item__ } from '#/features/__name__/schema'
// {{#hono}}
import { getApi } from '#/shared/api/hono/client'
// {{/hono}}

// {{#tanstack-start}}
// __Title__ data through TanStack Query, for components and route loaders.
// In a loader: await context.queryClient.ensureQueryData(__camel__Query); in a component: useSuspenseQuery(__camel__Query).
// {{/tanstack-start}}
// {{#next}}
// __Title__ data through TanStack Query, for client components: useQuery(__camel__Query).
// Server Components don't need it: they call the feature's service directly.
// {{/next}}
export const __camel__Query = queryOptions({
  queryKey: ['__name__'],
  // {{#hono}}
  queryFn: () => parseResponse(getApi()__apiKey__.$get()),
  // {{/hono}}
  // {{^hono}}
  queryFn: () => get__Name__(),
  // {{/hono}}
})

export function useCreate__Item__() {
  const queryClient = useQueryClient()
  // {{^hono}}
  // {{#tanstack-start}}
  const save = useServerFn(save__Item__)
  // {{/tanstack-start}}
  // {{/hono}}
  return useMutation({
    // {{#hono}}
    mutationFn: (input: New__Item__) => parseResponse(getApi()__apiKey__.$post({ json: input })),
    // {{/hono}}
    // {{^hono}}
    mutationFn: (input: New__Item__) => {{#tanstack-start}}save({ data: input }){{/tanstack-start}}{{#next}}save__Item__(input){{/next}},
    // {{/hono}}
    onSuccess: () => queryClient.invalidateQueries({ queryKey: __camel__Query.queryKey }),
    meta: { successMessage: '__Item__ saved' },
  })
}
