#!/usr/bin/env npx tsx
/* Derives the emitted DOM contract from the React components and writes it as a
 * fixture the Svelte tests assert against.
 *
 * Why this exists: the contract this library actually exposes is the class name
 * and the data-* attribute set — the stylesheet selects on
 * :scope[data-variant="info"]. A Svelte component that renders beautifully
 * while emitting data-motion="2" where React emits "3" is broken, and every
 * render test passes. That happened during the Badge port: the Svelte motion
 * default was 2 because the spec said so, and React's MotionContext default is
 * 3. Nothing caught it but rendering both and diffing.
 *
 * Derived, never hand-written: regenerate with `npm run build:contract`. */
import { renderToStaticMarkup } from 'react-dom/server'
import React from 'react'
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'

import { Badge } from '../src/components/badge'
import { Accordion } from '../src/components/accordion'
import { Checkbox } from '../src/components/checkbox'
import { useStyles } from '../src/core/styles/use-styles'
import { css } from '../src/core/styles/css-tag'

type Case = { name: string; props: Record<string, unknown> }

/* Attributes whose values differ between the two frameworks by construction
 * and carry no contract. React's useId and Svelte's $props.id() both generate
 * unique strings; the contract is that the label points at the input, which
 * the component's own tests assert. Comparing the literal value would fail
 * against two correct implementations. */
const IGNORED_ATTRS = ['id', 'aria-describedby']

const SUITES: { component: string; render: (p: Record<string, unknown>) => string; cases: Case[] }[] = [
  {
    component: 'Accordion',
    render: p => renderToStaticMarkup(React.createElement(Accordion, p as never)),
    cases: [
      { name: 'defaults', props: { items: [] } },
      { name: 'variant+size', props: { items: [], variant: 'bordered', size: 'lg' } },
      { name: 'motion override 0', props: { items: [], motion: 0 } },
    ],
  },
  {
    component: 'Checkbox',
    render: p => renderToStaticMarkup(React.createElement(Checkbox, p as never)),
    cases: [
      { name: 'defaults', props: {} },
      { name: 'size', props: { size: 'xl' } },
      { name: 'indeterminate', props: { indeterminate: true } },
      { name: 'disabled', props: { disabled: true } },
      { name: 'error', props: { error: 'Required' } },
      { name: 'motion override 0', props: { motion: 0 } },
    ],
  },
  {
    component: 'Badge',
    render: p => renderToStaticMarkup(React.createElement(Badge, p)),
    cases: [
      { name: 'defaults', props: {} },
      { name: 'variant+size', props: { variant: 'danger', size: 'xl' } },
      { name: 'outline', props: { outline: true } },
      { name: 'dot+pulse', props: { dot: true, pulse: true } },
      { name: 'count over max', props: { count: 150, maxCount: 99 } },
      { name: 'count zero', props: { count: 0 } },
      { name: 'motion override 0', props: { motion: 0 } },
      { name: 'removable', props: { removable: true } },
    ],
  },
]

function rootAttrs(html: string): Record<string, string> {
  const m = html.match(/^<[a-z]+([^>]*)>/)
  if (!m) throw new Error(`no root element in: ${html.slice(0, 80)}`)
  const out: Record<string, string> = {}
  for (const pair of m[1].match(/[a-zA-Z-]+="[^"]*"/g) || []) {
    const i = pair.indexOf('=')
    const key = pair.slice(0, i)
    if (IGNORED_ATTRS.includes(key)) continue
    out[key] = pair.slice(i + 2, -1)
  }
  return out
}

const fixture: Record<string, Record<string, { attrs: Record<string, string>; text: string }>> = {}

/* The class builder's output, captured from React's useStyles for the part
 * combinations the components themselves never produce. The Svelte package
 * copies those nine pure lines rather than importing them — importing would put
 * React in a Svelte bundle — so this is what keeps the copy honest.
 *
 * Captured through the fixture rather than by importing across packages,
 * because tsconfig's rootDir is src/ and a cross-package import breaks the
 * typecheck. Derived either way; this way it compiles. */
const CLS_PARTS: (string | false | null | undefined | 0 | '')[][] = [
  ['root'],
  ['dot'],
  ['root', 'dot'],
  ['root', false, 'icon'],
  [''],
  [0],
  ['root', null, undefined, 0, '', 'remove'],
  ['icon', 'dot', 'remove'],
]

const noop = css`.x{}`

// Rendered through SSR rather than renderHook: this script runs in plain Node
// with no DOM, and renderToStaticMarkup runs useCallback fine (only effects are
// skipped, and the class builder does not use one).
function ClsProbe({ parts }: { parts: (string | false | null | undefined | 0 | '')[] }) {
  const cls = useStyles('badge', noop)
  return React.createElement('i', null, cls(...parts))
}

const clsFixture: { parts: unknown[]; expected: string }[] = []
for (const parts of CLS_PARTS) {
  const html = renderToStaticMarkup(React.createElement(ClsProbe, { parts }))
  clsFixture.push({ parts, expected: html.replace(/<[^>]*>/g, '') })
}

for (const suite of SUITES) {
  fixture[suite.component] = {}
  for (const c of suite.cases) {
    const html = suite.render(c.props)
    fixture[suite.component][c.name] = {
      attrs: rootAttrs(html),
      text: html.replace(/<[^>]*>/g, '').trim(),
    }
  }
}

const OUT = resolve(import.meta.dirname, '../packages/svelte/tests/fixtures/contract.json')
const next = JSON.stringify({ components: fixture, cls: clsFixture }, null, 2) + '\n'
const total = Object.values(fixture).reduce((n, s) => n + Object.keys(s).length, 0)

// --check: fail if the committed fixture is stale. Without this the Svelte
// tests happily assert yesterday's contract after a React change and stay
// green — the same silent-drift shape as the hand-copied worker registry.
if (process.argv.includes('--check')) {
  const current = existsSync(OUT) ? readFileSync(OUT, 'utf8') : ''
  if (current !== next) {
    console.error('[contract] STALE: packages/svelte/.../contract.json does not match the React components.')
    console.error('[contract] Run `npm run build:contract` and commit the result.')
    process.exit(1)
  }
  console.log(`[contract] fresh: ${Object.keys(fixture).length} component(s), ${total} case(s)`)
} else {
  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(OUT, next)
  console.log(`[contract] ${Object.keys(fixture).length} component(s), ${total} case(s) -> ${OUT}`)
}
