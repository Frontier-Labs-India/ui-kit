#!/usr/bin/env node
/* Bundle budget for the Svelte package.
 *
 * Measures gzipped bytes of what ships — components, runtime JS and the
 * stylesheet, separately — against packages/svelte/.size-budget.json, and fails
 * on growth beyond the tolerance. The budget numbers were set from the measured
 * 0.1.0 build, not chosen; raise them deliberately, in the same commit as the
 * change that needs it.
 *
 *   node scripts/check-svelte-size.js            check
 *   node scripts/check-svelte-size.js --record   rewrite the budget from this build */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { gzipSync } from 'node:zlib'

const ROOT = resolve(import.meta.dirname, '..')
const DIST = resolve(ROOT, 'packages/svelte/dist')
const BUDGET = resolve(ROOT, 'packages/svelte/.size-budget.json')
const TOLERANCE = 0.10

if (!existsSync(DIST)) {
  console.error('FAIL: packages/svelte/dist missing — run `npm run build:svelte` first.')
  process.exit(1)
}

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)])
}
const gz = files => files.reduce((n, f) => n + gzipSync(readFileSync(f)).length, 0)
const all = walk(DIST)
const measured = {
  components: gz(all.filter(f => f.endsWith('.svelte'))),
  runtime: gz(all.filter(f => f.endsWith('.js'))),
  css: gz(all.filter(f => f.endsWith('ui-kit-svelte.css'))),
}

if (Object.values(measured).some(v => v === 0)) {
  console.error(`FAIL: a category measured 0 bytes ${JSON.stringify(measured)} — refusing to trust this build.`)
  process.exit(1)
}

if (process.argv.includes('--record')) {
  writeFileSync(BUDGET, JSON.stringify({
    _note: 'Gzipped bytes, measured from the build by check-svelte-size.js --record. Derived, not chosen.',
    ...measured,
  }, null, 2) + '\n')
  console.log(`recorded ${JSON.stringify(measured)}`)
  process.exit(0)
}

const budget = JSON.parse(readFileSync(BUDGET, 'utf8'))
let failed = false
for (const [k, v] of Object.entries(measured)) {
  const limit = Math.round(budget[k] * (1 + TOLERANCE))
  const status = v > limit ? 'OVER' : 'ok'
  if (v > limit) failed = true
  console.log(`  ${status.padEnd(4)} ${k.padEnd(10)} ${v} B gz  (budget ${budget[k]}, limit ${limit})`)
}
if (failed) { console.error('FAIL: over budget.'); process.exit(1) }
