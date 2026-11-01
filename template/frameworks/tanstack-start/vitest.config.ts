import { defineConfig } from 'vitest/config'
import viteReact from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'

// Tests run without the deploy adapter and the Start plugin: services and components are tested on their own.
// A component test opts into a browser-like DOM with a first-line comment: // @vitest-environment jsdom
export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [viteReact(), svgr()],
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    passWithNoTests: true,
  },
})
