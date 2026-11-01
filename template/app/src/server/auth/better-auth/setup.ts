import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
// {{#tanstack-start}}
import { tanstackStartCookies } from 'better-auth/tanstack-start'
// {{/tanstack-start}}
// {{#next}}
import { nextCookies } from 'better-auth/next-js'
// {{/next}}
// {{#email}}
// {{#tanstack-start}}
// {{#cloudflare}}
import { waitUntil } from 'cloudflare:workers'
// {{/cloudflare}}
// {{#vercel}}
import { waitUntil } from '@vercel/functions'
// {{/vercel}}
// {{/tanstack-start}}
// {{#next}}
import { after } from 'next/server'
// {{/next}}
// {{/email}}
import { authOptions } from '#/server/auth/better-auth/options'
import { getEnv } from '#/server/config/env'
import { type Db, getDb } from '#/server/db/drizzle/client'
import * as tables from '#/server/db/drizzle/tables'
// {{#email}}
import { type Email, sendEmail } from '#/server/email/{{emailProvider}}/send'
import ResetPasswordEmail from '#/server/email/templates/reset-password-email'
import VerifyEmail from '#/server/email/templates/verify-email'

// Better Auth's advice: never make the response wait for an email (that would reveal which addresses have an
// account), but keep the {{#cloudflare}}Worker{{/cloudflare}}{{^cloudflare}}server{{/cloudflare}} running until it's sent.
function sendInBackground(email: Email) {
  const sending = sendEmail(email).catch((error: unknown) => console.error('Email not sent:', error))
  // {{#tanstack-start}}
  {{#cloudflare}}waitUntil(sending){{/cloudflare}}{{#vercel}}waitUntil(sending){{/vercel}}{{#node}}void sending{{/node}}
  // {{/tanstack-start}}
  // {{#next}}
  after(sending)
  // {{/next}}
}
// {{/email}}

function createAuth(db: Db) {
  const env = getEnv()
  return betterAuth({
    ...authOptions,
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    database: drizzleAdapter(db, { provider: '{{authProvider}}', schema: tables }),
    // {{#email}}
    emailAndPassword: {
      ...authOptions.emailAndPassword,
      sendResetPassword: async ({ user, url }) => {
        sendInBackground({ to: user.email, subject: 'Reset your password', react: ResetPasswordEmail({ url }) })
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        sendInBackground({ to: user.email, subject: 'Confirm your email address', react: VerifyEmail({ url }) })
      },
    },
    // {{/email}}
    plugins: [
      ...authOptions.plugins,
      // {{#tanstack-start}}
      tanstackStartCookies(), // must stay last (Better Auth's TanStack Start guide)
      // {{/tanstack-start}}
      // {{#next}}
      nextCookies(), // must stay last (Better Auth's Next.js guide)
      // {{/next}}
    ],
  })
}

// {{^cloudflare}}
let auth: ReturnType<typeof createAuth> | undefined

// Better Auth for the app: one instance for the whole server process, created on first use.
export async function getAuth() {
  auth ??= createAuth(await getDb())
  return auth
}
// {{/cloudflare}}
// {{#cloudflare}}
// Better Auth for one request: Workers can't share a database connection between requests, so each request builds
// an instance around its own connection.
export async function getAuth() {
  return createAuth(await getDb())
}
// {{/cloudflare}}
