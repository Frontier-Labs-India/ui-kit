#!/usr/bin/env node
/* Parity as a list that may only shrink.
 *
 * Every React component in dist/component-meta.json must either have a .svelte
 * counterpart or be named in packages/svelte/NOT_PORTED.json. A ported
 * component still listed there fails, so the list cannot go stale; a component
 * missing from both fails, so a new React component cannot be forgotten.
 *
 * It reports "components ported", never bare "parity": the React barrel also
 * exports 29 core modules, 17 of them React-coupled, which this does not count. */
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const META = resolve(ROOT, 'dist/component-meta.json')
const DIR = resolve(ROOT, 'packages/svelte/src/components')
const LIST = resolve(ROOT, 'packages/svelte/NOT_PORTED.json')

if (!existsSync(META)) {
  console.error('FAIL: dist/component-meta.json missing — run `npm run build` first.')
  process.exit(1)
}
const meta = JSON.parse(readFileSync(META, 'utf8'))
const expected = meta.components.map(c => c.name).sort()

// Denominator check: refuse a partial or empty metadata build.
if (expected.length !== meta.totalComponents || expected.length < 100) {
  console.error(`FAIL: component-meta lists ${expected.length} (totalComponents=${meta.totalComponents}) — refusing to trust this run.`)
  process.exit(1)
}

const ported = readdirSync(DIR).filter(f => f.endsWith('.svelte')).map(f => f.slice(0, -7)).sort()
const notPorted = JSON.parse(readFileSync(LIST, 'utf8'))

let failed = false
const fail = msg => { console.error(`FAIL: ${msg}`); failed = true }

/* A .svelte component not in component-meta is allowed only as a companion
 * export: a name that some React component file actually exports alongside its
 * main component (FilterPill's file also exports FilterPillGroup). Checked
 * against the source rather than a hand-kept list, so a typo still fails. */
const reactExports = new Set()
for (const dir of ['src/components', 'src/domain']) {
  for (const f of readdirSync(resolve(ROOT, dir)).filter(f => f.endsWith('.tsx'))) {
    const src = readFileSync(resolve(ROOT, dir, f), 'utf8')
    for (const m of src.matchAll(/^export\s+(?:const|function|class)\s+([A-Z][A-Za-z0-9_]*)/gm)) reactExports.add(m[1])
  }
}
const companions = ported.filter(n => !expected.includes(n) && reactExports.has(n))
for (const n of ported) {
  if (!expected.includes(n) && !reactExports.has(n)) fail(`${n}.svelte is neither in component-meta nor exported by any React component file — misnamed?`)
}
for (const n of expected) {
  const isPorted = ported.includes(n)
  const listed = notPorted.includes(n)
  if (isPorted && listed) fail(`${n} is ported but still in NOT_PORTED.json — remove it (the list only shrinks)`)
  if (!isPorted && !listed) fail(`${n} has no Svelte component and is not in NOT_PORTED.json`)
}
for (const n of notPorted) if (!expected.includes(n)) fail(`${n} is in NOT_PORTED.json but is not a React component`)
if (new Set(notPorted).size !== notPorted.length) fail('NOT_PORTED.json contains duplicates')

const done = expected.filter(n => ported.includes(n)).length
const extra = companions.length ? ` Companion exports: ${companions.join(', ')}.` : ''
console.log(`${done}/${expected.length} components ported (${expected.length - done} remaining).${extra}`)
if (failed) process.exit(1)
