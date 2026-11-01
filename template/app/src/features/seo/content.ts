// Facts about the site used by page titles, link previews, JSON-LD, robots.txt, sitemap.xml and llms.txt.
// Keep the name and description identical everywhere: search engines and AI answers match on consistency.
export const site = {
  name: '{{name}}',
  url: 'https://example.com', // production origin, no trailing slash
  description: "(one sentence: who it's for and what they get)",
  locale: 'en',
  socialImage: '/og-image.png', // 1200×630 in public/
  sameAs: [] as string[], // official profiles: LinkedIn, X, GitHub, Instagram…
}

// AI search and assistant bots fetch pages to cite them in answers; training bots collect pages to train models.
// The choice is recorded in PROJECT.md → Decisions, and Cloudflare AI Crawl Control must match it.
export const aiCrawlers = { allowSearchBots: true, allowTrainingBots: true }

// Public pages listed in sitemap.xml and llms.txt. Pages built from the database are added in sitemap-xml.ts.
export const publicPages = [{ path: '/', title: site.name, summary: site.description }]
