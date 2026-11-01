import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Tailwind,
  Text,
} from 'react-email'

// Sent after sign-up to confirm the email address (Better Auth email verification). Preview: `{{run}} email:dev`.
export default function VerifyEmail({ url }: { url: string }) {
  return (
    <Html>
      <Head />
      <Preview>Confirm your email address</Preview>
      <Tailwind>
        <Body className="bg-neutral-100 p-4 font-sans">
          <Container className="mx-auto max-w-[480px] rounded-lg bg-white p-8">
            <Heading className="m-0 text-2xl">Confirm your email address</Heading>
            <Text className="text-base">Thanks for signing up to {{name}}. Confirm your address to finish.</Text>
            <Button href={url} className="rounded-md bg-neutral-900 px-5 py-3 text-white">
              Confirm email
            </Button>
            <Text className="text-sm text-neutral-600">
              Didn't sign up? You can ignore this email.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

VerifyEmail.PreviewProps = { url: 'http://localhost:3000/api/auth/verify-email?token=preview' }
