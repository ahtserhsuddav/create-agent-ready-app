import { aiCrawlers, site } from '#/features/seo/content'

// User agents as each AI company documents them; check their docs before adding more.
const aiSearchBots = [
  'OAI-SearchBot',
  'ChatGPT-User',
  'Claude-SearchBot',
  'Claude-User',
  'PerplexityBot',
  'Perplexity-User',
]
const aiTrainingBots = ['GPTBot', 'ClaudeBot', 'Google-Extended', 'Applebot-Extended', 'CCBot']

export function robotsTxt(): string {
  const blocked = [
    ...(aiCrawlers.allowSearchBots ? [] : aiSearchBots),
    ...(aiCrawlers.allowTrainingBots ? [] : aiTrainingBots),
  ]
  return [
    'User-agent: *',
    'Allow: /',
    ...blocked.flatMap((bot) => ['', `User-agent: ${bot}`, 'Disallow: /']),
    '',
    `Sitemap: ${site.url}/sitemap.xml`,
    '',
  ].join('\n')
}
