import { z } from 'zod'

// What the auth forms accept. TanStack Form checks it in the browser; Better Auth checks again on the server.
const password = z.string().min(8, 'Use at least 8 characters').max(128, 'Use at most 128 characters')

export const signInSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
})

export const signUpSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name'),
  email: z.email('Enter a valid email address'),
  password,
})

export type SignInInput = z.infer<typeof signInSchema>
export type SignUpInput = z.infer<typeof signUpSchema>
// {{#email}}

export const forgotPasswordSchema = z.object({ email: z.email('Enter a valid email address') })
export const resetPasswordSchema = z.object({ password })
// {{/email}}
