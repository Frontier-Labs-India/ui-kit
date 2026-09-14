import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/svelte'
import Badge from '../../components/Badge.svelte'
import fixture from '../fixtures/contract.json'

/* Asserts the Svelte component emits the same class and data-* set as React.
 * The fixture is generated from the React components by
 * scripts/generate-contract-fixtures.tsx — derived, not hand-written. */

const CASES: Record<string, Record<string, unknown>> = {
  defaults: {},
  'variant+size': { variant: 'danger', size: 'xl' },
  outline: { outline: true },
  'dot+pulse': { dot: true, pulse: true },
  'count over max': { count: 150, maxCount: 99 },
  'count zero': { count: 0 },
  'motion override 0': { motion: 0 },
  removable: { removable: true },
}

function rootAttrs(el: Element): Record<string, string> {
  const out: Record<string, string> = {}
  for (const a of [...el.attributes]) out[a.name] = a.value
  return out
}

describe('Badge emits React\'s DOM contract', () => {
  const expected = (fixture as Record<string, Record<string, { attrs: Record<string, string>; text: string }>>).Badge

  // Denominator check: an empty fixture would make every assertion vacuous.
  it('has cases to check', () => {
    expect(Object.keys(expected).length).toBeGreaterThan(0)
    expect(Object.keys(expected).sort()).toEqual(Object.keys(CASES).sort())
  })

  for (const [name, props] of Object.entries(CASES)) {
    it(`matches React for: ${name}`, () => {
      const { container } = render(Badge, { props })
      const el = container.querySelector('.ui-badge')!
      expect(rootAttrs(el)).toEqual(expected[name].attrs)
    })

    it(`matches React's text for: ${name}`, () => {
      const { container } = render(Badge, { props })
      expect(container.querySelector('.ui-badge')!.textContent!.trim()).toBe(expected[name].text)
    })
  }
})
