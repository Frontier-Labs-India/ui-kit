#!/usr/bin/env npx tsx
/* Renders every contract case with the React component and stores the full
 * server HTML, which the Svelte suite compares against its own rendered tree.
 *
 * Why the whole tree and not the root element: the contract is every class and
 * attribute the stylesheet selects on, at every depth. Root-only comparison let
 * a real bug through — Svelte's Checkbox spread its rest props onto the root
 * div where React spreads them onto the input — and it also missed that
 * Svelte's default motion level was 2 where React's is 3 until a render caught
 * it. Comparing the tree catches both classes.
 *
 * Cases:     packages/svelte/tests/contract/cases.ts
 * Fixture:   packages/svelte/tests/fixtures/contract.json
 * Derived, never hand-written: `npm run build:contract`; `--check` fails if stale. */
import { renderToStaticMarkup } from 'react-dom/server'
import React from 'react'
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { pathToFileURL } from 'node:url'

import { CASES } from '../packages/svelte/tests/contract/cases'
import { useStyles } from '../src/core/styles/use-styles'
import { css } from '../src/core/styles/css-tag'

const ROOT = resolve(import.meta.dirname, '..')
const meta = JSON.parse(readFileSync(resolve(ROOT, 'dist/component-meta.json'), 'utf8'))
const fileOf: Record<string, string> = Object.fromEntries(meta.components.map((c: { name: string; fileName: string }) => [c.name, c.fileName]))

function hydrate(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(hydrate)
  if (value && typeof value === 'object') {
    const v = value as Record<string, unknown>
    if ('$el' in v) return React.createElement('b', null, String(v.$el))
    if ('$fn' in v) return () => {}
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, hydrate(x)]))
  }
  return value
}

async function load(name: string) {
  const file = fileOf[name]
  if (!file) throw new Error(`${name} is not in component-meta.json`)
  for (const dir of ['src/components', 'src/domain']) {
    const p = resolve(ROOT, dir, `${file}.tsx`)
    if (existsSync(p)) {
      const mod = await import(pathToFileURL(p).href)
      if (!mod[name]) throw new Error(`${p} does not export ${name}`)
      return mod[name]
    }
  }
  throw new Error(`no source file for ${name} (${file}.tsx)`)
}

const components: Record<string, Record<string, { props: unknown; html: string }>> = {}
for (const name of Object.keys(CASES).sort()) {
  const Component = await load(name)
  components[name] = {}
  for (const [caseName, props] of Object.entries(CASES[name])) {
    const html = renderToStaticMarkup(React.createElement(Component, hydrate(props) as never))
    if (!html) throw new Error(`${name} / ${caseName} rendered nothing on the server — it cannot join this fixture`)
    components[name][caseName] = { props, html }
  }
}

/* The class builder's output, captured from React's useStyles for part
 * combinations the components never produce. The Svelte package copies those
 * nine pure lines rather than importing them, so this keeps the copy honest. */
const CLS_PARTS: (string | false | null | undefined | 0 | '')[][] = [
  ['root'], ['dot'], ['root', 'dot'], ['root', false, 'icon'], [''], [0],
  ['root', null, undefined, 0, '', 'remove'], ['icon', 'dot', 'remove'],
]
const noop = css`.x{}`
function ClsProbe({ parts }: { parts: (string | false | null | undefined | 0 | '')[] }) {
  const cls = useStyles('badge', noop)
  return React.createElement('i', null, cls(...parts))
}
const cls = CLS_PARTS.map(parts => ({
  parts,
  expected: renderToStaticMarkup(React.createElement(ClsProbe, { parts })).replace(/<[^>]*>/g, ''),
}))

const OUT = resolve(ROOT, 'packages/svelte/tests/fixtures/contract.json')
const next = JSON.stringify({ version: 2, components, cls }, null, 2) + '\n'
const total = Object.values(components).reduce((n, s) => n + Object.keys(s).length, 0)
const summary = `${Object.keys(components).length} component(s), ${total} case(s)`

if (process.argv.includes('--check')) {
  if (!existsSync(OUT) || readFileSync(OUT, 'utf8') !== next) {
    console.error(`[contract] STALE: ${OUT} does not match the React components. Run \`npm run build:contract\`.`)
    process.exit(1)
  }
  console.log(`[contract] fresh: ${summary}`)
} else {
  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(OUT, next)
  console.log(`[contract] ${summary}`)
}
