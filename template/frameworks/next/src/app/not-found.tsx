import Link from 'next/link'

export default function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="opacity-75">The page you're looking for doesn't exist or has moved.</p>
      <Link href="/" className="font-medium underline underline-offset-4">
        Go to the home page
      </Link>
    </main>
  )
}
