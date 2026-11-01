import type { BetterAuthOptions } from 'better-auth'

// Better Auth settings with no secrets and no database, shared by setup.ts and better-auth.config.ts (what
// `{{run}} auth:generate` reads to write tables.ts). A plugin that adds tables goes in plugins here; then run
// `{{run}} auth:generate` and `{{run}} db:generate`. More sign-in methods: the better-auth skills.
export const authOptions = {
  emailAndPassword: { enabled: true },
  plugins: [],
} satisfies BetterAuthOptions
