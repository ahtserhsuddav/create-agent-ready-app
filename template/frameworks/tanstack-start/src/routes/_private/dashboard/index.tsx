import { createFileRoute{{^auth-pages}}, useRouter{{/auth-pages}} } from '@tanstack/react-router'
// {{#auth-pages}}
import { useSignOut } from '#/features/auth/hooks/use-auth'
// {{/auth-pages}}
// {{^auth-pages}}
import { authClient } from '#/shared/auth/better-auth/client'
// {{/auth-pages}}
// {{#shadcn}}
import { Button } from '#/shared/components/ui/button'
// {{/shadcn}}

export const Route = createFileRoute('/_private/dashboard/')({
  head: () => ({ meta: [{ title: 'Dashboard' }, { name: 'robots', content: 'noindex' }] }),
  component: DashboardPage,
})

// An example signed-in page: the user comes from the _private guard's route context.
function DashboardPage() {
  const { user } = Route.useRouteContext()
  // {{#auth-pages}}
  const signOut = useSignOut()
  // {{/auth-pages}}
  // {{^auth-pages}}
  const router = useRouter()

  async function signOut() {
    await authClient.signOut()
    await router.invalidate()
    await router.navigate({ to: '/' })
  }
  // {{/auth-pages}}

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold">Hi, {user.name || user.email}</h1>
      {{#shadcn}}
      <Button {{#auth-pages}}disabled={signOut.isPending} onClick={() => signOut.mutate()}{{/auth-pages}}{{^auth-pages}}onClick={signOut}{{/auth-pages}}>
        Sign out
      </Button>
      {{/shadcn}}
      {{^shadcn}}
      <button
        type="button"
        className="rounded-md border px-4 py-2"
        {{#auth-pages}}disabled={signOut.isPending}{{/auth-pages}}
        onClick={{#auth-pages}}{() => signOut.mutate()}{{/auth-pages}}{{^auth-pages}}{signOut}{{/auth-pages}}
      >
        Sign out
      </button>
      {{/shadcn}}
    </main>
  )
}
