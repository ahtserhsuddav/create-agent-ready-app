'use client'

// {{#shadcn}}
import { Button } from '#/shared/components/ui/button'

// {{/shadcn}}
// Shown when a page throws, instead of a blank screen. "Try again" renders the page again.
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="opacity-75">{error.digest ? `Reference: ${error.digest}` : 'Please try again.'}</p>
      {{#shadcn}}
      <Button className="self-start" onClick={reset}>
        Try again
      </Button>
      {{/shadcn}}
      {{^shadcn}}
      <button type="button" className="self-start rounded-md border px-4 py-2" onClick={reset}>
        Try again
      </button>
      {{/shadcn}}
    </main>
  )
}
