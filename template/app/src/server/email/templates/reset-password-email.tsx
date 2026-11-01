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

// Sent when someone asks to reset their password (Better Auth password reset). Preview: `{{run}} email:dev`.
export default function ResetPasswordEmail({ url }: { url: string }) {
  return (
    <Html>
      <Head />
      <Preview>Reset your password</Preview>
      <Tailwind>
        <Body className="bg-neutral-100 p-4 font-sans">
          <Container className="mx-auto max-w-[480px] rounded-lg bg-white p-8">
            <Heading className="m-0 text-2xl">Reset your password</Heading>
            <Text className="text-base">Someone asked to reset the password of your {{name}} account. The link works for one hour.</Text>
            <Button href={url} className="rounded-md bg-neutral-900 px-5 py-3 text-white">
              Choose a new password
            </Button>
            <Text className="text-sm text-neutral-600">
              Didn't ask? You can ignore this email: your password stays the same.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

ResetPasswordEmail.PreviewProps = { url: 'http://localhost:3000/api/auth/reset-password/preview?callbackURL=%2Freset-password' }
