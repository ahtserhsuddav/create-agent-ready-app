// Structured data for search engines and AI answers, in the page's server HTML. `<` is escaped so the JSON can't
// close the script tag early (Next.js's JSON-LD guide).
export function JsonLd({ data }: { data: object[] }) {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: serialized JSON with < escaped, Next.js's documented pattern
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}
