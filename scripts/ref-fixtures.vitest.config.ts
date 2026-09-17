import { defineConfig, mergeConfig } from 'vitest/config'
import base from '../vitest.config'

/* Runs only scripts/generate-ref-fixtures.tsx: it needs jsdom and React's client
 * renderer, which the tsx-run SSR generator deliberately does not load. */
export default mergeConfig(base, defineConfig({
  test: { include: ['scripts/generate-ref-fixtures.tsx'], exclude: [] },
}))
