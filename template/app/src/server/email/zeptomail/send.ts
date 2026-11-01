import type { ReactElement } from 'react'
import { render } from 'react-email'
import { getEnv } from '#/server/config/env'

export type Email = { to: string; subject: string; react: ReactElement }

// ZeptoMail's send-mail API (the official SDK's host; accounts in other regions use their region's API host).
// Plain fetch instead of the SDK, so it runs on every runtime, Cloudflare Workers included.
const sendMailUrl = 'https://api.zeptomail.com/v1.1/email'

// Sends one email through ZeptoMail, built from a React Email template in src/server/email/templates/.
// Without ZEPTOMAIL_TOKEN in development, the email's text prints to the console instead of being sent.
/** @public */
export async function sendEmail({ to, subject, react }: Email) {
  const env = getEnv()
  const text = await render(react, { plainText: true })
  if (!env.ZEPTOMAIL_TOKEN) {
    if ({{#tanstack-start}}import.meta.env.PROD{{/tanstack-start}}{{#next}}process.env.NODE_ENV === 'production'{{/next}}) throw new Error('ZEPTOMAIL_TOKEN is not set')
    console.info(`[email not sent: no ZEPTOMAIL_TOKEN] ${subject} → ${to}\n${text}`)
    return
  }
  const response = await fetch(sendMailUrl, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Zoho-enczapikey ${env.ZEPTOMAIL_TOKEN}`,
    },
    body: JSON.stringify({
      from: { address: env.EMAIL_FROM, name: env.EMAIL_FROM_NAME },
      to: [{ email_address: { address: to } }],
      subject,
      htmlbody: await render(react),
      textbody: text,
    }),
  })
  if (!response.ok) {
    throw new Error(`ZeptoMail could not send "${subject}": ${response.status} ${await response.text()}`)
  }
}
