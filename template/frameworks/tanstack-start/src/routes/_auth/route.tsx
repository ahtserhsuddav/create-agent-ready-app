import { createFileRoute, Link, Outlet, redirect } from '@tanstack/react-router'
import { getSession } from '#/features/auth/functions'
// {{#seo}}
import { site } from '#/features/seo/content'
// {{/seo}}

// The layout for the sign-in and sign-up pages. Signed-in visitors skip them and go to the dashboard, and search
// engines don't index them.
export const Route = createFileRoute('/_auth')({
  beforeLoad: async () => {
    if (await getSession()) throw redirect({ to: '/dashboard' })
  },
  head: () => ({ meta: [{ name: 'robots', content: 'noindex' }] }),
  component: AuthLayout,
})

function AuthLayout() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 p-6">
      <Link to="/" className="text-center text-xl font-semibold">
        {{#seo}}{site.name}{{/seo}}{{^seo}}{{name}}{{/seo}}
      </Link>
      <Outlet />
    </main>
  )
}
