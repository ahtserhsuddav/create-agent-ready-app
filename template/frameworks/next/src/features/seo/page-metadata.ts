import type { Metadata } from 'next'
import { site } from '#/features/seo/content'

type PageMeta = { title: string; description: string; path: string; image?: string; noindex?: boolean }

// A page's metadata: title, description, canonical URL and link previews (Open Graph, X). Relative URLs resolve
// against metadataBase in src/app/layout.tsx. Titles ≤ 60 characters, descriptions ≤ 155 (skill seo-aeo).
export function pageMetadata({ title, description, path, image = site.socialImage, noindex = false }: PageMeta): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, siteName: site.name, images: [image], type: 'website' },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
  }
}
