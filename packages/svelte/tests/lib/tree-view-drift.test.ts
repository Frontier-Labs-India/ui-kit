import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/* lib/tree-view.ts copies React's pure tree helpers. Each function must stay
 * token-for-token identical (whitespace and the `export` keyword aside) to the
 * one in src/domain/tree-view.tsx, so a React fix cannot silently skip Svelte. */
const react = readFileSync(resolve(import.meta.dirname, '../../../../src/domain/tree-view.tsx'), 'utf8')
const ours = readFileSync(resolve(import.meta.dirname, '../../src/lib/tree-view.ts'), 'utf8')

function fn(src: string, name: string): string {
  const start = src.search(new RegExp(`(?:export )?function ${name}\\(`))
  if (start < 0) throw new Error(`${name} not found`)
  const end = src.indexOf('\n}\n', start)
  return src.slice(start, end + 2).replace(/^export /, '').replace(/\s+/g, ' ')
}

describe('lib/tree-view.ts', () => {
  for (const name of ['findParentId', 'hasExpandableChildren', 'findNodeById']) {
    it(`${name} matches React's`, () => {
      expect(fn(ours, name)).toBe(fn(react, name))
    })
  }
})
