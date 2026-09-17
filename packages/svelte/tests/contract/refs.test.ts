import { describe, it, expect, vi, afterAll } from 'vitest'
import { render } from '@testing-library/svelte'
import { createRawSnippet, flushSync, type Component } from 'svelte'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import * as pkg from '../../src/index.js'
import contract from '../fixtures/contract.json'
import refs from '../fixtures/refs.json'
import { CONTRACT_NOW } from './cases.js'
import { PROP_RENAMES, UNIVERSAL_RENAMES } from './divergences.js'
import { describeElement, type RefTarget } from './ref-target.js'

/* Every component takes a bindable `ref`: the element React's `ref` receives
 * (tests/fixtures/refs.json, derived from React by scripts/generate-ref-fixtures.tsx),
 * or — where React's component takes no ref — its own root element. */

/* React gives these no element; the Svelte component binds the one named here.
 * A case where React has none and the component is not listed must give null. */
const EXTENSIONS: Record<string, string> = {
  ConfirmDialog: 'the <dialog> of the Dialog it renders',
  DataTableSuggestions: 'its root, null while no insight is shown',
  TopologyGraphCanvas: 'its <canvas>',
  TopologyGraphSVG: 'its <svg>',
  Tour: 'its overlay root, null while closed',
}

/* Exported components with no contract case, so the loop below cannot render
 * them; each still has to declare the prop. */
const NO_REF: Record<string, string> = {
  ComponentErrorBoundary: 'renders its children unchanged — it has no element of its own',
}

type Fx = { components: Record<string, Record<string, { props: unknown }>> }
const cases = (contract as unknown as Fx).components
const expected = refs as unknown as Record<string, Record<string, RefTarget>>

function renamed(name: string, props: unknown): Record<string, unknown> {
  const out = { ...(props as Record<string, unknown>) }
  for (const { from, to } of [...UNIVERSAL_RENAMES, ...(PROP_RENAMES[name] ?? [])]) {
    if (from in out) { out[to] = out[from]; delete out[from] }
  }
  return out
}

function hydrate(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(hydrate)
  if (value && typeof value === 'object') {
    const v = value as Record<string, unknown>
    if ('$el' in v) return createRawSnippet(() => ({ render: () => `<b>${String(v.$el)}</b>` }))
    if ('$fn' in v) return () => {}
    if ('$date' in v) return new Date(String(v.$date))
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, hydrate(x)]))
  }
  return value
}

describe('bindable ref — every contract case', () => {
  afterAll(() => { vi.useRealTimers() })

  it('the React fixture covers exactly the contract cases', () => {
    const keys = (o: Record<string, Record<string, unknown>>) => Object.fromEntries(Object.entries(o).map(([n, c]) => [n, Object.keys(c).sort()]))
    expect(keys(expected)).toEqual(keys(cases))
    expect(Object.keys(EXTENSIONS).filter(n => !(n in cases) || Object.values(expected[n]).some(t => t !== null))).toEqual([])
  })

  for (const [name, byCase] of Object.entries(cases)) {
    for (const caseName of Object.keys(byCase)) {
      it(`${name} / ${caseName}`, () => {
        const Comp = (pkg as Record<string, unknown>)[name] as Component<any>
        let ref: unknown = null
        const props = hydrate(renamed(name, byCase[caseName].props)) as Record<string, unknown>
        Object.defineProperty(props, 'ref', { get: () => ref, set: v => { ref = v }, enumerable: true, configurable: true })
        vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] })
        vi.setSystemTime(CONTRACT_NOW)
        const { container } = render(Comp, { props })
        flushSync()
        vi.useRealTimers()

        // Taken out of the rest props, so it never reaches the DOM as an attribute.
        expect(container.querySelector('[ref]')).toBeNull()

        const react = expected[name][caseName]
        if (react === null && name in EXTENSIONS) {
          if (ref !== null) expect(container.contains(ref as Node)).toBe(true)
        } else {
          expect(describeElement(container, ref)).toEqual(react)
        }
      })
    }
  }
})

describe('bindable ref — declared by every exported component', () => {
  const index = readFileSync(resolve(import.meta.dirname, '../../src/index.ts'), 'utf8')
  const files = [...index.matchAll(/export\s*\{\s*default as (\w+)[^}]*\}\s*from\s*'\.\/((?:components|lib)\/\w+\.svelte)'/g)]

  it('reads the exported components from the index', () => {
    expect(files.length).toBeGreaterThan(150)
    expect(Object.keys(NO_REF).filter(n => !files.some(([, name]) => name === n))).toEqual([])
  })

  for (const [, name, file] of files) {
    if (name in NO_REF) continue
    it(name, () => {
      const src = readFileSync(resolve(import.meta.dirname, '../../src', file), 'utf8')
      expect(src).toMatch(/\bref = \$bindable\(null\)/)
      expect(src).toMatch(/bind:(?:this=\{ref\}|ref\b)/)
    })
  }
})
