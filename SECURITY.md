# Security policy

## Reporting a vulnerability
Report it privately on GitHub: open this repository's **Security** tab and choose **Report a vulnerability**. Please
don't open a public issue. You'll get a reply as soon as possible, and credit in the release notes if you want it.

## Supported versions
Fixes go into the newest release only. A project created with an older version picks up the newest agent files with
`<run> kit:update`; its packages are kept current by Dependabot.

## Scope
- **In scope:** the CLI and the files it writes into projects (`template/`), such as an unsafe default in generated
  code, a permission rule that lets agents read secrets, or a workflow that leaks a token.
- **Report upstream:** a vulnerability in a package a project uses (TanStack, Hono, Drizzle, Better Auth…) goes to
  that project.

## What the CLI does on your machine
It creates files in the folder you name and runs official tools through your package manager: the TanStack CLI,
shadcn, the Better Auth CLI, drizzle-kit, Wrangler and the `skills` CLI. It collects no telemetry, and it sets
`DO_NOT_TRACK=1` for the tools it runs. Releases are published from GitHub Actions with npm trusted publishing, and
each version has a provenance statement on npm that links it to the workflow run that built it. The exception is
0.2.0, the first version, which was published by hand to create the package.
