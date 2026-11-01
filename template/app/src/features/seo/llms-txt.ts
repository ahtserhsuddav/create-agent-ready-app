import { publicPages, site } from '#/features/seo/content'

// llms.txt (https://llmstxt.org): a short Markdown map of the site for AI assistants and answer engines.
export function llmsTxt(): string {
  const pages = publicPages.map(
    (page) => `- [${page.title}](${new URL(page.path, site.url).href}): ${page.summary}`,
  )
  return [`# ${site.name}`, '', `> ${site.description}`, '', '## Pages', '', ...pages, ''].join(
    '\n',
  )
}
