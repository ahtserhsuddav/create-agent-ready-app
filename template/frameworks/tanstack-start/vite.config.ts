import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import svgr from 'vite-plugin-svgr'
// {{#cloudflare}}
import { cloudflare } from '@cloudflare/vite-plugin'
// {{/cloudflare}}
// {{#nitro}}
import { nitro } from 'nitro/vite'
// {{/nitro}}

// Plugin order follows TanStack Start's hosting guide: the deploy adapter first, tanstackStart() before viteReact().
export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    // {{#cloudflare}}
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    // {{/cloudflare}}
    // {{#node}}
    nitro({{#runtime-bun}}{ preset: 'bun' }{{/runtime-bun}}),
    // {{/node}}
    // {{#vercel}}
    // Nitro detects Vercel when it builds there (vercel.json sets the framework).
    nitro(),
    // {{/vercel}}
    tailwindcss(),
    // Any .svg imports as a React component: import Logo from '#/shared/assets/icons/logo.svg?react'
    svgr({
      svgrOptions: {
        icon: true,
        plugins: ['@svgr/plugin-svgo', '@svgr/plugin-jsx'],
        replaceAttrValues: { '#000': 'currentColor', '#000000': 'currentColor', black: 'currentColor' },
      },
    }),
    // {{#static}}
    tanstackStart({
      prerender: { enabled: true, crawlLinks: true, failOnError: true },
      // {{#seo}}
      pages: [{ path: '/robots.txt' }, { path: '/sitemap.xml' }, { path: '/llms.txt' }],
      // {{/seo}}
    }),
    // {{/static}}
    // {{^static}}
    tanstackStart(),
    // {{/static}}
    viteReact(),
  ],
})
