import { createIsomorphicFn } from '@tanstack/react-start'
import { getRequestHeader } from '@tanstack/react-start/server'
import { hc } from 'hono/client'
import { type AppType, app } from '#/server/api/hono/app'

// The typed client for the /api/* routes (Hono RPC). Read results with Hono's parseResponse, which throws on errors:
//   const posts = await parseResponse(getApi().posts.$get())
// In the browser it calls the API over HTTP. During server rendering it calls the Hono app in-process, forwarding
// the visitor's cookie so signed-in routes work. That server branch is the one place src/shared imports server
// code: Start removes it from the browser build.
/** @public */
export const getApi = createIsomorphicFn()
  .server(() => {
    const cookie = getRequestHeader('cookie')
    return hc<AppType>('http://localhost', {
      fetch: async (input: RequestInfo | URL, init?: RequestInit) => app.request(input, init),
      headers: cookie ? { cookie } : {},
    }).api
  })
  .client(() => hc<AppType>(window.location.origin).api)
