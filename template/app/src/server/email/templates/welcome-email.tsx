import { Body, Container, Head, Heading, Html, Preview, Tailwind, Text } from 'react-email'

// A starting template: send it with sendEmail({ to, subject, react: WelcomeEmail({ name }) }).
// Preview every template with `{{run}} email:dev`.
export default function WelcomeEmail({ name }: { name: string }) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to {{name}}</Preview>
      <Tailwind>
        <Body className="bg-neutral-100 p-4 font-sans">
          <Container className="mx-auto max-w-[480px] rounded-lg bg-white p-8">
            <Heading className="m-0 text-2xl">Welcome, {name}</Heading>
            <Text className="text-base">Thanks for joining {{name}}.</Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

WelcomeEmail.PreviewProps = { name: 'Alex' }
