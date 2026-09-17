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

  it('every name is a real export of the package', () => {
    const exported = new Set(Object.keys(ui))
    expect(components.map(c => c.name).filter(n => !exported.has(n))).toEqual([])
  })

  it('every documented import line names that export', () => {
    const wrong = components.filter(c => Object.values(c.imports).some(line => !line.startsWith(`import { ${c.name} } from`)))
    expect(wrong.map(c => c.name)).toEqual([])
  })

  it('displayName matches name', () => {
    expect(components.filter(c => c.displayName !== c.name).map(c => c.name)).toEqual([])
  })
})
