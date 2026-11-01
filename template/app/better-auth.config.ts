import { betterAuth } from 'better-auth'
import { authOptions } from './src/server/auth/better-auth/options'

// Read only by the Better Auth CLI (`{{run}} auth:generate`), which needs the plugins but no database or secrets.
export const auth = betterAuth(authOptions)
