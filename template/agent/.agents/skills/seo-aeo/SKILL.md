---
name: seo-aeo
description: "SEO and answer-engine optimization (ChatGPT, Claude, Perplexity, Google AI answers) for public pages: page heads, server rendering, JSON-LD, robots.txt, sitemap, llms.txt, answer-first writing, AI-crawler policy."
---

# SEO and AEO

Search engines and AI answer engines both need the same things: real HTML from the server, one clear topic per
page, facts stated plainly, and consistent site facts. Everything comes from `src/features/seo/`.

## Every public page
- `head: () => pageHead({ title, description, path, jsonLd })` from `#/features/seo/page-head`: title ≤ 60 characters,
  description ≤ 155, a canonical path, the social image (1200×630).
- Exactly one `<h1>`; headings in order; semantic landmarks (`header`, `nav`, `main`, `footer`); descriptive `alt`
  text; real links (`<Link>`/`<a href>`) with descriptive text, never "click here".
- Content in the server HTML. {{framework}} renders on the server by default; keep it on for public pages
  (no `ssr: false`), and don't hide important text behind tabs or buttons that only JavaScript opens.
- Fast: hero image eager with width and height set, fonts self-hosted with `font-display: swap`, nothing that
  shifts the layout. Targets: LCP < 2.5 s, INP < 200 ms, CLS < 0.1.
- Add the page to `publicPages` in `content.ts` (it feeds `sitemap.xml` and `llms.txt`). Pages from the
  database go into `sitemap-xml.ts`.
- `noindex: true` for thank-you pages, account pages and duplicates.

## Site files (already wired: {{#tanstack-start}}`src/routes/robots[.]txt.ts`, `sitemap[.]xml.ts`, `llms[.]txt.ts`{{/tanstack-start}}{{#next}}`src/app/robots.ts`, `sitemap.ts`, `llms.txt/route.ts`{{/next}})
- Fill `site` in `content.ts` before launch: the production URL, the name and description used everywhere,
  `sameAs` profile links.
- JSON-LD: `organizationJsonLd()` and `websiteJsonLd()` on the home page; per page type `breadcrumbJsonLd`,
  `faqJsonLd` (only for a visible FAQ), and Article, Product, LocalBusiness, Event or SoftwareApplication as needed
  (add builders to `structured-data.ts`). Markup must match what's visible on the page.

## Writing for answer engines (AEO)
- One question per section, phrased the way people ask it ("How much does X cost?"), as an `h2` or `h3`.
- Answer it in the first 40–60 words under the heading, then give detail. Lead with the fact, not the setup.
- Use lists for steps, tables for comparisons and prices, and real numbers with their source and date.
- Name the author and show published and updated dates on articles; keep facts current.
- Use the same name for the business and its products everywhere: site, JSON-LD and profiles (`sameAs`).
- An FAQ section on key pages, answering real customer questions; mark it up with `faqJsonLd`.
- Specific beats generic: who it's for, what it costs, where it's available, how it's different.

## AI crawler policy
- Set `aiCrawlers` in `content.ts` and record the choice in PROJECT.md → Decisions. Default: allow both kinds.
  - Search and assistant bots fetch pages to cite them (OAI-SearchBot, ChatGPT-User, Claude-SearchBot,
    Claude-User, PerplexityBot). Blocking them removes you from AI answers.
  - Training bots collect pages for model training (GPTBot, ClaudeBot, Google-Extended, Applebot-Extended,
    CCBot). Blocking them doesn't affect normal search.
- Cloudflare can block AI bots at the edge: check AI Crawl Control matches the policy, and keep Cloudflare's
  managed robots.txt off (ours is served by the app). Crawler Hints (IndexNow) tells Bing about changes faster.

## Check and measure
- Server HTML: `curl -s <url> -A "OAI-SearchBot" | rg "<h1"` shows the content without JavaScript.
- Before launch, and after big page changes: Lighthouse (SEO, accessibility, performance), Google's Rich Results
  Test and https://validator.schema.org for JSON-LD.
- After launch: Google Search Console and Bing Webmaster Tools (Bing's index feeds Copilot and ChatGPT search);
  submit `/sitemap.xml` to both. Cloudflare AI Crawl Control shows which AI bots visit.
