import { site } from '#/features/seo/content'

type PageHead = {
  title: string
  description: string
  path: string
  image?: string
  noindex?: boolean
  jsonLd?: object[]
}

// A route's head(): title, description, canonical URL, link previews (Open Graph, X) and JSON-LD.
// Titles ≤ 60 characters, descriptions ≤ 155 (skill seo-aeo).
export function pageHead({
  title,
  description,
  path,
  image = site.socialImage,
  noindex = false,
  jsonLd = [],
}: PageHead) {
  const url = new URL(path, site.url).href
  return {
    meta: [
      { title },
      { name: 'description', content: description },
      ...(noindex ? [{ name: 'robots', content: 'noindex' }] : []),
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: site.name },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: url },
      { property: 'og:image', content: new URL(image, site.url).href },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
    links: [{ rel: 'canonical', href: url }],
    scripts: jsonLd.map((data) => ({
      type: 'application/ld+json',
      children: JSON.stringify(data),
    })),
  }
}
