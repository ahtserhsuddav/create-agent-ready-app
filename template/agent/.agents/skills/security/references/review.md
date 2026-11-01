# Security review checklist (OWASP Top 10:2025, mapped to this stack)

Check each item against the diff. Report findings as `file:line — problem — fix`.

1. **Broken access control:** every {{#tanstack-start}}server function{{/tanstack-start}}{{#next}}Server Action{{/next}}{{#hono}}, Hono route{{/hono}} and service checks the user and record
   ownership on the server. No IDs from the client trusted without that check. No admin action reachable by others.
2. **Security misconfiguration:** no debug output, stack traces or default credentials in production; security
   headers set;{{#cloudflare}} `wrangler.jsonc` has no secrets in `vars`;{{/cloudflare}} preview deployments carry no production data.
3. **Software supply chain:** new packages were approved, are maintained and official; `{{lockfile}}` changed only as
   expected; `{{audit}} --audit-level=high` is clean.
4. **Cryptographic failures:** HTTPS everywhere; secrets compared in constant time; no home-made crypto; tokens
   from `crypto.getRandomValues()`; passwords handled only by the auth library.
5. **Injection:** queries only through Drizzle's builder (no `sql.raw` with input); no user input in shell
   commands, HTML or redirects (an allowlist for redirect targets).
6. **Insecure design:** rate limits on sign-in, sign-up, password reset and expensive endpoints; business rules
   (prices, quotas, states) enforced on the server.
7. **Authentication failures:** sessions in secure, httpOnly cookies; email verification and password rules set;
   sign-out invalidates the session; sensitive actions need a fresh session.
8. **Software and data integrity:** webhook signatures verified before parsing; uploads validated; no scripts loaded
   from untrusted CDNs.
9. **Logging and alerting failures:** auth failures and permission denials are logged without personal data;
   the host's logs ({{#cloudflare}}Workers observability{{/cloudflare}}{{^cloudflare}}the server log{{/cloudflare}}) are on.
10. **Mishandling exceptional conditions:** errors fail closed (deny on error); clients get generic messages;
    timeouts and retries can't double-charge or double-send.
