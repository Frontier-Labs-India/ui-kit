import { defineConfig } from 'vitest/config'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  plugins: [svelte({ hot: false })],
  // Without the browser condition Vitest resolves Svelte's server build and
  // component mounting silently produces no DOM — every test passes vacuously.
  resolve: { conditions: ['browser'] },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/__tests__/**/*.test.ts'],
  },
})
