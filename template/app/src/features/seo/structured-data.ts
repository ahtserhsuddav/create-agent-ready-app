import { site } from '#/features/seo/content'

// JSON-LD builders for pageHead({ jsonLd }). Check results with https://validator.schema.org and Google's Rich Results Test.
const context = 'https://schema.org'

export const organizationJsonLd = () => ({
  '@context': context,
  '@type': 'Organization',
  name: site.name,
  url: site.url,
  description: site.description,
  sameAs: site.sameAs,
})

export const websiteJsonLd = () => ({
  '@context': context,
  '@type': 'WebSite',
  name: site.name,
  url: site.url,
  description: site.description,
})

/** @public For pages below the home page. */
export const breadcrumbJsonLd = (items: { name: string; path: string }[]) => ({
  '@context': context,
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: new URL(item.path, site.url).href,
  })),
})

/** @public For a page's visible FAQ section (the questions and answers must be on the page). */
export const faqJsonLd = (items: { question: string; answer: string }[]) => ({
  '@context': context,
  '@type': 'FAQPage',
  mainEntity: items.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: { '@type': 'Answer', text: item.answer },
  })),
})
