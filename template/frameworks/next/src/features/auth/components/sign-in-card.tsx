import Link from 'next/link'
import { SignInForm } from '#/features/auth/components/sign-in-form'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '#/shared/components/ui/card'

// The sign-in page's card: email and password, and the way to an account.
export function SignInCard({ redirectTo }: { redirectTo: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Welcome back.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <SignInForm redirectTo={redirectTo} />
        {{#email}}
        <Link href="/forgot-password" className="text-center text-sm underline underline-offset-4">
          Forgot your password?
        </Link>
        {{/email}}
      </CardContent>
      <CardFooter className="justify-center gap-1 text-sm">
        No account yet?
        <Link href="/sign-up" className="font-medium underline underline-offset-4">
          Sign up
        </Link>
      </CardFooter>
    </Card>
  )
}
