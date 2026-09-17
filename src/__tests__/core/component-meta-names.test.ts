import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import * as ui from '../../index'

/* component-meta.json is published: it generates the documented import line for
 * every component, feeds the MCP registry that AI assistants read, and is the
 * parity denominator for the Svelte package. A name there that is not a real
 * export produces an import that does not compile. It happened: card-3d was
 * listed as `Card-3d`, documenting `import { Card-3d } from '@frontier-labs/ui-kit'`. */

const META = resolve(import.meta.dirname, '../../../dist/component-meta.json')

describe.skipIf(!existsSync(META))('component-meta names', () => {
  const meta = existsSync(META) ? JSON.parse(readFileSync(META, 'utf8')) : { components: [] }
  const components: { name: string; displayName: string; imports: Record<string, string> }[] = meta.components

  it('lists every Standard-tier component', () => {
    expect(components.length).toBe(meta.totalComponents)
    expect(components.length).toBeGreaterThan(100)
  })

  it('every name is a valid JavaScript identifier', () => {
    expect(components.map(c => c.name).filter(n => !/^[A-Za-z_$][\w$]*$/.test(n))).toEqual([])
  })

  /* OPEN DECISION, not a pass: these two are counted in the 162 and documented
   * with an import line, but are not exported by the package. Both are internal
   * rendering backends that TopologyGraph (which is exported) chooses between.
   * Either export them — the count stays 162 — or exclude internal renderers
   * from component-meta, making the published count 160 across the website,
   * README, check-counts and the Svelte parity denominator. That is a product
   * call. Listed so it cannot be forgotten; the stale check below fails the
   * moment either becomes a real export. */
  const NOT_EXPORTED_PENDING_DECISION = ['TopologyGraphCanvas', 'TopologyGraphSVG']

  it('every name is a real export of the package, apart from the recorded open decision', () => {
    const exported = new Set(Object.keys(ui))
    const missing = components.map(c => c.name).filter(n => !exported.has(n))
    expect(missing.filter(n => !NOT_EXPORTED_PENDING_DECISION.includes(n))).toEqual([])
    expect(NOT_EXPORTED_PENDING_DECISION.filter(n => !missing.includes(n))).toEqual([])
  })

  it('every documented import line names that export', () => {
    const wrong = components.filter(c => Object.values(c.imports).some(line => !line.startsWith(`import { ${c.name} } from`)))
    expect(wrong.map(c => c.name)).toEqual([])
  })

  it('displayName matches name', () => {
    expect(components.filter(c => c.displayName !== c.name).map(c => c.name)).toEqual([])
  })
})
