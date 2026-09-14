import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    css: true,
    // packages/* are workspaces with their own vitest configs and their own
    // plugins. Without this the root run globs packages/svelte's tests and
    // fails to transform .svelte files, having no svelte plugin loaded.
    exclude: ['**/node_modules/**', '**/dist/**', '**/visual/**', '**/*.spec.ts', '**/packages/**'],
  },
})
