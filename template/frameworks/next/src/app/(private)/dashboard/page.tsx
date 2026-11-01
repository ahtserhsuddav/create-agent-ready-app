import type { Metadata } from 'next'
import { SignOutButton } from '#/features/auth/components/sign-out-button'
import { getSession } from '#/server/auth/better-auth/session'

export const metadata: Metadata = { title: 'Dashboard' }

// An example signed-in page; the (private) layout already checked the session.
export default async function DashboardPage() {
  const session = await getSession()
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold">Hi, {session?.user.name || session?.user.email}</h1>
      <SignOutButton />
    </main>
  )
}
