import { robotsTxt } from '#/features/seo/robots-txt'

// /robots.txt, built from src/features/seo (skill seo-aeo).
export function GET() {
  return new Response(robotsTxt(), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
