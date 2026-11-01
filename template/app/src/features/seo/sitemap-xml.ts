import { publicPages, site } from '#/features/seo/content'

// sitemap.xml for search engines. Add pages that come from the database here too.
export function sitemapXml(): string {
  const urls = publicPages.map(
    (page) => `  <url><loc>${new URL(page.path, site.url).href}</loc></url>`,
  )
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`
}
