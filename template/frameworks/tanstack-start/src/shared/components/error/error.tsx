import { type ErrorComponentProps, Link, useRouter } from '@tanstack/react-router'
// {{#shadcn}}
import { Button } from '#/shared/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '#/shared/components/ui/empty'
// {{/shadcn}}

// Router-wide fallbacks (src/router.tsx). Visitors get a plain message; error details show only in development.
export function ErrorComponent({ error }: ErrorComponentProps) {
  const router = useRouter()
  const message =
    import.meta.env.DEV && error instanceof Error ? error.message : 'Please try again in a moment.'
  // {{#shadcn}}
  return (
    <Empty className="min-h-screen">
      <EmptyHeader>
        <EmptyTitle>Something went wrong</EmptyTitle>
        <EmptyDescription>{message}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button onClick={() => router.invalidate()}>Try again</Button>
      </EmptyContent>
    </Empty>
  )
  // {{/shadcn}}
  // {{^shadcn}}
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-8 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="opacity-75">{message}</p>
      <button
        type="button"
        className="rounded-md border px-4 py-2"
        onClick={() => router.invalidate()}
      >
        Try again
      </button>
    </main>
  )
  // {{/shadcn}}
}

export function NotFoundComponent() {
  // {{#shadcn}}
  return (
    <Empty className="min-h-screen">
      <EmptyHeader>
        <EmptyTitle>Page not found</EmptyTitle>
        <EmptyDescription>The page you're looking for doesn't exist or has moved.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild>
          <Link to="/">Go home</Link>
        </Button>
      </EmptyContent>
    </Empty>
  )
  // {{/shadcn}}
  // {{^shadcn}}
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-8 text-center">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="opacity-75">The page you're looking for doesn't exist or has moved.</p>
      <Link to="/" className="rounded-md border px-4 py-2">
        Go home
      </Link>
    </main>
  )
  // {{/shadcn}}
}
