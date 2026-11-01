import { Link } from '@tanstack/react-router'
import { SignUpForm } from '#/features/auth/components/sign-up-form'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '#/shared/components/ui/card'

// The sign-up page's card.
export function SignUpCard({ redirectTo }: { redirectTo: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>It takes less than a minute.</CardDescription>
      </CardHeader>
      <CardContent>
        <SignUpForm redirectTo={redirectTo} />
      </CardContent>
      <CardFooter className="justify-center gap-1 text-sm">
        Already have an account?
        <Link to="/sign-in" className="font-medium underline underline-offset-4">
          Sign in
        </Link>
      </CardFooter>
    </Card>
  )
}
