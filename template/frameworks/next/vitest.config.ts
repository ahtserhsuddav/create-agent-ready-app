import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Tests run without Next.js: services and components are tested on their own.
// A component test opts into a browser-like DOM with a first-line comment: // @vitest-environment jsdom
export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [viteReact()],
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    passWithNoTests: true,
  },
})
