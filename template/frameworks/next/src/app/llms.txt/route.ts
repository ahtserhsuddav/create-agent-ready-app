import { llmsTxt } from '#/features/seo/llms-txt'

// /llms.txt, built from src/features/seo (skill seo-aeo).
export function GET() {
  return new Response(llmsTxt(), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
