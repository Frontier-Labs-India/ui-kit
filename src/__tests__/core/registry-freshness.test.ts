import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '../../..')
const BUILT = resolve(ROOT, 'dist/mcp/registry.json')
const WORKER = resolve(ROOT, 'workers/mcp/src/registry.json')

describe('worker registry freshness', () => {
  it('the worker ships the registry the build produced', () => {
    // Denominator check: a comparison against a missing file proves nothing.
    expect(existsSync(BUILT), 'run `npm run build` first').toBe(true)
    expect(existsSync(WORKER)).toBe(true)

    const built = JSON.parse(readFileSync(BUILT, 'utf8'))
    const worker = JSON.parse(readFileSync(WORKER, 'utf8'))

    expect(worker.componentCount).toBe(built.componentCount)
    expect(worker.version).toBe(built.version)
  })
})
