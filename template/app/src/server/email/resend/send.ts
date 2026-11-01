import type { ReactElement } from 'react'
import { render } from 'react-email'
import { Resend } from 'resend'
import { getEnv } from '#/server/config/env'

export type Email = { to: string; subject: string; react: ReactElement }

// Sends one email through Resend, built from a React Email template in src/server/email/templates/.
// Without RESEND_API_KEY in development, the email's text prints to the console instead of being sent.
/** @public */
export async function sendEmail({ to, subject, react }: Email) {
  const env = getEnv()
  const text = await render(react, { plainText: true })
  if (!env.RESEND_API_KEY) {
    if ({{#tanstack-start}}import.meta.env.PROD{{/tanstack-start}}{{#next}}process.env.NODE_ENV === 'production'{{/next}}) throw new Error('RESEND_API_KEY is not set')
    console.info(`[email not sent: no RESEND_API_KEY] ${subject} → ${to}\n${text}`)
    return
  }
  const resend = new Resend(env.RESEND_API_KEY)
  const { error } = await resend.emails.send({
    from: `${env.EMAIL_FROM_NAME} <${env.EMAIL_FROM}>`,
    to,
    subject,
    html: await render(react),
    text,
  })
  if (error) throw new Error(`Resend could not send "${subject}": ${error.message}`)
}
