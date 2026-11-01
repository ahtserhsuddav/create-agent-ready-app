// {{#cloudflare}}
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare'
// {{/cloudflare}}
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // {{^cloudflare}}
  // Next.js's recommended defaults (create-next-app).
  cacheComponents: true,
  partialPrefetching: true,
  // {{/cloudflare}}
  // {{#cloudflare}}
  // Cache Components stay off on Workers until OpenNext runs them reliably (opennextjs-cloudflare issues #1450, #1464).
  // {{/cloudflare}}
  turbopack: {
    rules: {
      '*.css': { loaders: ['@tailwindcss/turbopack'], as: '*.css' },
      // Any `.svg?react` import is a React component (SVGR): import Logo from '#/shared/assets/icons/logo.svg?react'
      '*.svg': {
        condition: { query: /[?&]react(?=&|$)/ },
        loaders: [
          {
            loader: '@svgr/webpack',
            options: {
              icon: true,
              replaceAttrValues: { '#000': 'currentColor', '#000000': 'currentColor', black: 'currentColor' },
            },
          },
        ],
        as: '*.js',
      },
    },
  },
}

export default nextConfig
// {{#cloudflare}}

// Bindings from wrangler.jsonc (Hyperdrive, D1, secrets) during `next dev` (OpenNext's Cloudflare guide).
initOpenNextCloudflareForDev()
// {{/cloudflare}}
