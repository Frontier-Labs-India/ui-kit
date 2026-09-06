#!/usr/bin/env node
// The Cloudflare worker imports ./registry.json from its own source directory,
// but build-registry.js writes to dist/mcp/. That copy was made by hand once and
// went five months stale. This makes it derived.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const BUILT = resolve(ROOT, 'dist/mcp/registry.json')
const WORKER = resolve(ROOT, 'workers/mcp/src/registry.json')
const check = process.argv.includes('--check')

if (!existsSync(BUILT)) {
  console.error('[sync-worker-registry] dist/mcp/registry.json missing — run `npm run build:registry` first')
  process.exit(1)
}

const built = readFileSync(BUILT, 'utf8')
const current = existsSync(WORKER) ? readFileSync(WORKER, 'utf8') : ''

if (built === current) {
  console.log('[sync-worker-registry] worker registry is current')
  process.exit(0)
}
if (check) {
  const b = JSON.parse(built)
  const c = current ? JSON.parse(current) : {}
  console.error(`[sync-worker-registry] STALE: worker has ${c.componentCount} components at v${c.version}, build produced ${b.componentCount} at v${b.version}`)
  console.error('[sync-worker-registry] run `npm run sync:registry`')
  process.exit(1)
}
writeFileSync(WORKER, built)
console.log(`[sync-worker-registry] updated worker registry to ${JSON.parse(built).componentCount} components`)
