import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/svelte'
import type { Component } from 'svelte'
import Accordion from '../../components/Accordion.svelte'
import Badge from '../../components/Badge.svelte'
import Checkbox from '../../components/Checkbox.svelte'
import fixture from '../fixtures/contract.json'

/* Asserts every ported Svelte component emits the same root class and data-*
 * set as its React counterpart. The fixture is generated from the React
 * components by scripts/generate-contract-fixtures.tsx — derived, not written
 * by hand — and `npm run test:contract-fresh` fails if it goes stale.
 *
 * This exists because the contract the stylesheet selects on is the class and
 * the attributes, not the visual result. A component that renders correctly
 * while emitting data-motion="2" where React emits "3" is broken and every
 * render test passes. That is a real bug this caught during the Badge port. */

const IGNORED_ATTRS = ['id', 'aria-describedby']

type FixtureCase = { attrs: Record<string, string>; text: string }
const f = fixture as Record<string, Record<string, FixtureCase>>

const SUITES: { name: string; component: Component<any>; root: string; cases: Record<string, Record<string, unknown>> }[] = [
  {
    name: 'Accordion',
    component: Accordion as Component<any>,
    root: '.ui-accordion',
    cases: {
      defaults: { items: [] },
      'variant+size': { items: [], variant: 'bordered', size: 'lg' },
      'motion override 0': { items: [], motion: 0 },
    },
  },
  {
    name: 'Badge',
    component: Badge as Component<any>,
    root: '.ui-badge',
    cases: {
      defaults: {},
      'variant+size': { variant: 'danger', size: 'xl' },
      outline: { outline: true },
      'dot+pulse': { dot: true, pulse: true },
      'count over max': { count: 150, maxCount: 99 },
      'count zero': { count: 0 },
      'motion override 0': { motion: 0 },
      removable: { removable: true },
    },
  },
  {
    name: 'Checkbox',
    component: Checkbox as Component<any>,
    root: '.ui-checkbox',
    cases: {
      defaults: {},
      size: { size: 'xl' },
      indeterminate: { indeterminate: true },
      disabled: { disabled: true },
      error: { error: 'Required' },
      'motion override 0': { motion: 0 },
    },
  },
]

function rootAttrs(el: Element): Record<string, string> {
  const out: Record<string, string> = {}
  for (const a of [...el.attributes]) {
    if (IGNORED_ATTRS.includes(a.name)) continue
    out[a.name] = a.value
  }
  return out
}

describe('React DOM contract', () => {
  // Denominator check: an empty or partial fixture would make this vacuous.
  it('covers every component in the fixture, and no more', () => {
    expect(SUITES.map(s => s.name).sort()).toEqual(Object.keys(f).sort())
    expect(SUITES.length).toBeGreaterThan(0)
  })

  for (const suite of SUITES) {
    describe(suite.name, () => {
      it('covers every case in the fixture', () => {
        expect(Object.keys(suite.cases).sort()).toEqual(Object.keys(f[suite.name]).sort())
      })

      for (const [name, props] of Object.entries(suite.cases)) {
        it(`matches React's attributes for: ${name}`, () => {
          const { container } = render(suite.component, { props })
          expect(rootAttrs(container.querySelector(suite.root)!)).toEqual(f[suite.name][name].attrs)
        })
      }
    })
  }
})
