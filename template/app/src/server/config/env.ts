// {{#cloudflare}}
// {{#tanstack-start}}
import { env } from 'cloudflare:workers'
// {{/tanstack-start}}
// {{#next}}
import { getCloudflareContext } from '@opennextjs/cloudflare'
// {{/next}}
// {{/cloudflare}}
import { z } from 'zod'

// Every secret and setting the server reads, checked on use so a missing value fails with its name.
// Local values: .env (names in .env.example). Production: docs/DEPLOYMENT.md.
const envSchema = z.object({
  // {{^cloudflare}}
  // {{#postgres}}
  DATABASE_URL: z.url(),
  // {{/postgres}}
  // {{/cloudflare}}
  // {{#auth}}
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  // {{/auth}}
  // {{#email}}
  EMAIL_FROM: z.email(),
  EMAIL_FROM_NAME: z.string().min(1),
  // {{/email}}
  // {{#resend}}
  // Optional in development: without it, emails print to the console instead.
  RESEND_API_KEY: z.string().min(1).optional(),
  // {{/resend}}
  // {{#zeptomail}}
  // Optional in development: without it, emails print to the console instead.
  ZEPTOMAIL_TOKEN: z.string().min(1).optional(),
  // {{/zeptomail}}
})

export function getEnv() {
  return envSchema.parse({{#cloudflare}}{{#tanstack-start}}env{{/tanstack-start}}{{#next}}getCloudflareContext().env{{/next}}{{/cloudflare}}{{^cloudflare}}process.env{{/cloudflare}})
}
