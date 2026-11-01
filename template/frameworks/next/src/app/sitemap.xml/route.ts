import { sitemapXml } from '#/features/seo/sitemap-xml'

// /sitemap.xml, built from src/features/seo (skill seo-aeo).
export function GET() {
  return new Response(sitemapXml(), { headers: { 'Content-Type': 'application/xml; charset=utf-8' } })
}
