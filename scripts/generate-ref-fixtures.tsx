/* Records which element React's `ref` lands on for every contract case, so the
 * Svelte package's bindable `ref` can be held to the same element.
 *
 * Why a client render: renderToStaticMarkup never attaches refs. And why derive
 * it at all instead of assuming the root: React 19 passes `ref` to function
 * components as a prop, so where it lands depends on where each component
 * spreads its props — the <input> for Checkbox and FormInput, the <dialog> for
 * Dialog, nothing for ConfirmDialog. A probe found the root-element
 * assumption wrong for over a dozen of them.
 *
 * An element is described as { tag, classes, nth }: its tag, its class set and
 * its position among the container's elements with that same tag and class set.
 * That survives the whitespace and wrapper differences the DOM contract already
 * tolerates, where a plain element index would not.
 *
 * Fixture:  packages/svelte/tests/fixtures/refs.json
 * Write:    npm run build:refs      Check (CI): npm run test:refs-fresh */
import { it, vi } from 'vitest'
import React from 'react'
import { render, cleanup } from '@testing-library/react'
import { writeFileSync, readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { CASES, CONTRACT_NOW } from '../packages/svelte/tests/contract/cases'
import { loadComponent, loadParts, caseElement } from './contract-react'
import { describeElement, type RefTarget } from '../packages/svelte/tests/contract/ref-target'

const ROOT = resolve(import.meta.dirname, '..')
const OUT = resolve(ROOT, 'packages/svelte/tests/fixtures/refs.json')
it('ref targets', async () => {
  // jsdom lacks these; the Svelte suite stubs the same ones (tests/setup.ts).
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) { this.setAttribute('open', '') }
  HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) { this.removeAttribute('open') }
  globalThis.IntersectionObserver ??= class { observe() {} unobserve() {} disconnect() {} takeRecords() { return [] } } as never
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(CONTRACT_NOW)

  const out: Record<string, Record<string, RefTarget>> = {}
  const parts = await loadParts(CASES)
  for (const name of Object.keys(CASES).sort()) {
    const Component = await loadComponent(name)
    out[name] = {}
    for (const [caseName, props] of Object.entries(CASES[name])) {
      const ref = React.createRef<Element>()
      const { container } = render(caseElement(Component, props, parts, { ref }))
      out[name][caseName] = describeElement(container, ref.current)
      cleanup()
    }
  }
  vi.useRealTimers()

  const next = JSON.stringify(out, null, 1) + '\n'
  if (import.meta.env.MODE === 'check') {
    if (!existsSync(OUT) || readFileSync(OUT, 'utf8') !== next) {
      throw new Error('refs.json is stale — run `npm run build:refs` and commit the result')
    }
  } else {
    writeFileSync(OUT, next)
  }
}, 600_000)
