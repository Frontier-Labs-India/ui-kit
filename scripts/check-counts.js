#!/usr/bin/env node
// Twenty different component counts were published across this repo (144, 145,
// 147, 148, 154, 156, 159, 178 as totals, plus stale per-tier and per-category
// figures). Prose may only state a number this script derives from build output,
// and must say what that number counts.
//
// Why a gate rather than a one-time fix: a number that CAN drift WILL drift.
// Same reasoning as the docs_gen golden file and `brand-wordmark --check`.
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { execSync } from 'node:child_process'

const ROOT = resolve(import.meta.dirname, '..')
const need = (p) => {
  const f = resolve(ROOT, p)
  if (!existsSync(f)) { console.error(`[check-counts] ${p} missing — run \`npm run build\``); process.exit(1) }
  return f
}

const meta = JSON.parse(readFileSync(need('dist/component-meta.json'), 'utf8'))
const registry = JSON.parse(readFileSync(need('dist/mcp/registry.json'), 'utf8'))
const cssCount = readdirSync(need('dist/css/components')).filter(f => f.endsWith('.css')).length

const DERIVED = {
  'components with extracted metadata': meta.totalComponents,
  'components in the Standard tier': meta.tierCounts.standard,
  'components in the Lite tier': meta.tierCounts.lite,
  'components in the Premium tier': meta.tierCounts.premium,
  'entries in the MCP registry': registry.componentCount,
  'components with standalone CSS': cssCount,
}
const allowed = new Set(Object.values(DERIVED).map(String))

// Historical records state what was true at a past version. They are not claims
// about the library today and must not be rewritten.
const HISTORICAL = [/^CHANGELOG\.md$/, /^changes\.md$/, /^docs\/superpowers\//, /^PLAN-\d+\.md$/]

console.log('[check-counts] derived from build output:')
for (const [k, v] of Object.entries(DERIVED)) console.log(`  ${String(v).padStart(4)}  ${k}`)

const files = execSync('git ls-files -- "*.md" "*.ts" "*.tsx" "*.json"', { cwd: ROOT, encoding: 'utf8' })
  .split('\n').filter(Boolean)
  .filter(f => !f.startsWith('dist/') && f !== 'workers/mcp/src/registry.json')
  .filter(f => !HISTORICAL.some(re => re.test(f)))

// Denominator check: a scan that matches nothing proves nothing.
if (files.length < 100) {
  console.error(`[check-counts] only ${files.length} files scanned — refusing to trust that`)
  process.exit(1)
}

const RE = /(~\s*)?\b(\d{2,4})\s+components\b/gi
const RELEASE = /\bv\d+\.\d+/            // "New in v2.4 (30 components)" — historical
let bad = 0, claims = 0, exempt = 0

for (const rel of files) {
  const lines = readFileSync(resolve(ROOT, rel), 'utf8').split('\n')
  lines.forEach((line, i) => {
    for (const m of line.matchAll(RE)) {
      claims++
      if (m[1]) { exempt++; continue }              // "~20 components" is a hypothetical
      if (RELEASE.test(line)) { exempt++; continue } // tied to a named past release
      // "React 19 components" is a framework version, not a count of ours.
      if (/\b(React|Vue|Angular|Svelte|Node)\s+$/i.test(line.slice(0, m.index))) { exempt++; continue }
      if (allowed.has(m[2])) continue
      console.error(`[check-counts] ${rel}:${i + 1}: "${m[0].trim()}" is not a derived count`)
      bad++
    }
  })
}

console.log(`[check-counts] ${claims} count claims across ${files.length} files — ${exempt} exempt, ${bad} undefined`)
if (claims === 0) {
  console.error('[check-counts] zero claims found — the pattern has stopped matching, which is not the same as clean')
  process.exit(1)
}
if (bad) {
  console.error('[check-counts] FAIL — state a derived number, and say what it counts')
  process.exit(1)
}
console.log('[check-counts] OK')
