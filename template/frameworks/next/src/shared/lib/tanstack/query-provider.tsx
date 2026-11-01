'use client'

import { isServer, type QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import type { ReactNode } from 'react'
import { newQueryClient } from '#/shared/lib/tanstack/query-client'

// One QueryClient per request on the server, one for the whole visit in the browser (TanStack Query's Next.js App
// Router guide).
let browserQueryClient: QueryClient | undefined

function getQueryClient() {
  if (isServer) return newQueryClient()
  browserQueryClient ??= newQueryClient()
  return browserQueryClient
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient()
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools buttonPosition="bottom-left" />
    </QueryClientProvider>
  )
}
