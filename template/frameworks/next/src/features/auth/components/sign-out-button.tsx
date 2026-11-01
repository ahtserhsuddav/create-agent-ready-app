'use client'

// {{#auth-pages}}
import { useSignOut } from '#/features/auth/hooks/use-auth'
// {{/auth-pages}}
// {{^auth-pages}}
import { useRouter } from 'next/navigation'
import { authClient } from '#/shared/auth/better-auth/client'
// {{/auth-pages}}
// {{#shadcn}}
import { Button } from '#/shared/components/ui/button'
// {{/shadcn}}

export function SignOutButton() {
  // {{#auth-pages}}
  const signOut = useSignOut()
  // {{/auth-pages}}
  // {{^auth-pages}}
  const router = useRouter()

  async function signOut() {
    await authClient.signOut()
    router.push('/')
    router.refresh()
  }
  // {{/auth-pages}}

  return (
    {{#shadcn}}
    <Button className="self-start" {{#auth-pages}}disabled={signOut.isPending} onClick={() => signOut.mutate()}{{/auth-pages}}{{^auth-pages}}onClick={signOut}{{/auth-pages}}>
      Sign out
    </Button>
    {{/shadcn}}
    {{^shadcn}}
    <button
      type="button"
      className="self-start rounded-md border px-4 py-2"
      {{#auth-pages}}disabled={signOut.isPending}{{/auth-pages}}
      onClick={{#auth-pages}}{() => signOut.mutate()}{{/auth-pages}}{{^auth-pages}}{signOut}{{/auth-pages}}
    >
      Sign out
    </button>
    {{/shadcn}}
  )
}
