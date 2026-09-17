#!/usr/bin/env node
/* Per-component bundle budget for the Svelte package.
 *
 * A whole-package total cannot be a gate for a package that grows on purpose:
 * every legitimate port pushes it over, the only response is to re-record it,
 * and re-recording also silently absorbs a real regression elsewhere. So each
 * shipped unit is budgeted separately, gzipped:
 *
 *   component:<Name>   its .svelte source
 *   lib:<Name>         shared .svelte pieces (e.g. ErrorBoundary)
 *   css:<file>         its block in ui-kit-svelte.css
 *   module:<path>      each shipped .js module except the barrel (actions, runes, lib, vendored core)
 *   css:svelte-only    the Svelte-specific rules
 *
 * An existing entry growing more than 10% fails. A unit with no budget entry
 * fails too, so a new component is recorded deliberately:
 *
 *   node scripts/check-svelte-size.js            check
 *   node scripts/check-svelte-size.js --record   ADD entries for new units only
 *   node scripts/check-svelte-size.js --record --rebaseline NAME[,NAME]
 *                                                re-measure named entries, on purpose
 *
 * Entries for units that no longer ship fail as stale. Numbers are measured
 * from the build, never chosen. */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { resolve, join, basename } from 'node:path'
import { gzipSync } from 'node:zlib'

const ROOT = resolve(import.meta.dirname, '..')
const DIST = resolve(ROOT, 'packages/svelte/dist')
const BUDGET = resolve(ROOT, 'packages/svelte/.size-budget.json')
const TOLERANCE = 0.10

if (!existsSync(DIST)) {
  console.error('FAIL: packages/svelte/dist missing — run `npm run build:svelte` first.')
  process.exit(1)
}

const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(e =>
  e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)])
const gz = buf => gzipSync(buf).length
const all = walk(DIST)

const measured = {}
// Every shipped .svelte file, not only components/ — lib/ holds shared pieces
// such as ErrorBoundary that dozens of components render.
for (const f of all.filter(f => f.endsWith('.svelte'))) {
  const kind = f.includes('/components/') ? 'component' : 'lib'
  measured[`${kind}:${basename(f, '.svelte')}`] = gz(readFileSync(f))
}
// Each shipped .js module is its own unit, as each component is. A single
// "runtime" total grew with every port that added a helper module (diff,
// sparkline, formatters), so it demanded a re-baseline every few commits —
// the habit per-unit budgets exist to prevent. The barrel (dist/index.js) is
// excluded: one re-export line per component, tree-shaken by consumers.
const BARREL = resolve(DIST, 'index.js')
for (const f of all.filter(f => f.endsWith('.js') && f !== BARREL)) {
  measured[`module:${f.slice(DIST.length + 1).replace(/\.js$/, '')}`] = gz(readFileSync(f))
}

const sheet = readFileSync(resolve(DIST, 'styles/ui-kit-svelte.css'), 'utf8')
for (const m of sheet.matchAll(/\/\* ([a-z0-9-]+) \*\/\n([\s\S]*?)\n\/\* end \1 \*\//g)) {
  measured[`css:${m[1]}`] = gz(Buffer.from(m[2]))
}

// Denominator: a build with nothing measured is not a pass.
const components = Object.keys(measured).filter(k => k.startsWith('component:')).length
const cssBlocks = Object.keys(measured).filter(k => k.startsWith('css:')).length
const modules = Object.keys(measured).filter(k => k.startsWith('module:')).length
if (components === 0 || cssBlocks === 0 || modules === 0) {
  console.error(`FAIL: measured ${components} components, ${cssBlocks} css blocks, ${modules} modules — refusing to trust this build.`)
  process.exit(1)
}

const budget = existsSync(BUDGET) ? JSON.parse(readFileSync(BUDGET, 'utf8')) : {}
const entries = Object.fromEntries(Object.entries(budget).filter(([k]) => !k.startsWith('_')))

if (process.argv.includes('--record')) {
  const i = process.argv.indexOf('--rebaseline')
  const rebaseline = i > 0 ? (process.argv[i + 1] || '').split(',').filter(Boolean) : []
  const next = { ...entries }
  const added = [], rebased = []
  for (const [k, v] of Object.entries(measured)) {
    if (!(k in next)) { next[k] = v; added.push(k) }
    else if (rebaseline.includes(k)) { rebased.push(`${k} ${next[k]} -> ${v}`); next[k] = v }
  }
  for (const k of rebaseline) if (!(k in measured)) { console.error(`FAIL: --rebaseline ${k}: no such unit`); process.exit(1) }
  const sorted = Object.fromEntries(Object.entries(next).sort(([a], [b]) => a.localeCompare(b)))
  writeFileSync(BUDGET, JSON.stringify({
    _note: 'Gzipped bytes per shipped unit, measured by check-svelte-size.js --record. Derived, not chosen. See the script header before editing.',
    ...sorted,
  }, null, 2) + '\n')
  console.log(`added ${added.length}: ${added.join(', ') || '-'}`)
  if (rebased.length) console.log(`rebaselined: ${rebased.join('; ')}`)
  process.exit(0)
}

let failed = false
for (const [k, v] of Object.entries(measured)) {
  if (!(k in entries)) { console.error(`FAIL: ${k} (${v} B gz) has no budget entry — record it: node scripts/check-svelte-size.js --record`); failed = true; continue }
  const limit = Math.round(entries[k] * (1 + TOLERANCE))
  if (v > limit) { console.error(`FAIL: ${k} ${v} B gz exceeds ${limit} (budget ${entries[k]} +10%)`); failed = true }
}
for (const k of Object.keys(entries)) {
  if (!(k in measured)) { console.error(`FAIL: budget entry ${k} no longer ships — remove it`); failed = true }
}
const total = Object.values(measured).reduce((a, b) => a + b, 0)
if (failed) process.exit(1)
console.log(`OK: ${Object.keys(measured).length} units within budget (${components} components, ${modules} modules, ${cssBlocks} css blocks, ${total} B gz total).`)
