/* Records which element React's `ref` lands on for every contract case, so the
 * Svelte package's bindable `ref` can be held to the same element.
 *
 * Why a client render: renderToStaticMarkup never attaches refs. And why derive
 * it at all instead of assuming the root: React 19 passes `ref` to function
 * components as a prop, so where it lands depends on where each component
 * spreads its props — the <input> for Checkbox and FormInput, the <dialog> for
 * Dialog, nothing for ConfirmDialog. A probe found 13 components where the
 * root-element assumption is wrong.
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
import { CASES, SOURCES, CONTRACT_NOW } from '../packages/svelte/tests/contract/cases'
import { describeElement, type RefTarget } from '../packages/svelte/tests/contract/ref-target'

const ROOT = resolve(import.meta.dirname, '..')
const OUT = resolve(ROOT, 'packages/svelte/tests/fixtures/refs.json')
const meta = JSON.parse(readFileSync(resolve(ROOT, 'dist/component-meta.json'), 'utf8'))
const fileOf: Record<string, string> = Object.fromEntries(meta.components.map((c: { name: string; fileName: string }) => [c.name, c.fileName]))

function hydrate(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(hydrate)
  if (value && typeof value === 'object') {
    const v = value as Record<string, unknown>
    if ('$el' in v) return React.createElement('b', null, String(v.$el))
    if ('$date' in v) return new Date(String(v.$date))
    if ('$fn' in v) return () => {}
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, hydrate(x)]))
  }
  return value
}

async function load(name: string): Promise<React.ComponentType> {
  if (SOURCES[name]) {
    const [file, exportName = name] = SOURCES[name].split('#')
    return (await import(resolve(ROOT, file)))[exportName]
  }
  for (const dir of ['src/components', 'src/domain']) {
    const p = resolve(ROOT, dir, `${fileOf[name]}.tsx`)
    if (existsSync(p)) return (await import(p))[name]
  }
  throw new Error(`no source file for ${name}`)
}

it('ref targets', async () => {
  // jsdom lacks these; the Svelte suite stubs the same ones (tests/setup.ts).
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) { this.setAttribute('open', '') }
  HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) { this.removeAttribute('open') }
  globalThis.IntersectionObserver ??= class { observe() {} unobserve() {} disconnect() {} takeRecords() { return [] } } as never
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(CONTRACT_NOW)

  const out: Record<string, Record<string, RefTarget>> = {}
  for (const name of Object.keys(CASES).sort()) {
    const Component = await load(name)
    out[name] = {}
    for (const [caseName, props] of Object.entries(CASES[name])) {
      const ref = React.createRef<Element>()
      const { container } = render(React.createElement(Component, { ...(hydrate(props) as object), ref } as never))
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
