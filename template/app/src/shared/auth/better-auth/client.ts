import { createAuthClient } from 'better-auth/react'

// Better Auth in the browser: authClient.signIn.email(…), authClient.signOut(), authClient.useSession().
// The API is on the same origin, so no baseURL.
/** @public */
export const authClient = createAuthClient()
