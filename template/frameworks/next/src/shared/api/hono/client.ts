import { hc } from 'hono/client'
import type { AppType } from '#/server/api/hono/app'

// The typed client for the /api/* routes (Hono RPC), for client components and their hooks. Read results with
// Hono's parseResponse, which throws on errors:
//   const posts = await parseResponse(getApi().posts.$get())
// Server Components don't call the API over HTTP: they call the feature's service directly.
/** @public */
export const getApi = () => hc<AppType>(window.location.origin).api
