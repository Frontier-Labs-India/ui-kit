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

  it('matches the build in full, apart from the build timestamp', () => {
    // Count and version alone miss a stale registry with the same number of
    // components — a renamed or re-documented one. generatedAt is the only
    // field allowed to differ; sync-worker-registry.js ignores it for the same
    // reason, so a rebuild does not rewrite an unchanged committed file.
    const strip = (t: string) => {
      const { generatedAt: _ignored, ...rest } = JSON.parse(t)
      return rest
    }
    expect(strip(readFileSync(WORKER, 'utf8'))).toEqual(strip(readFileSync(BUILT, 'utf8')))
  })
})
