#!/usr/bin/env node
/* The Svelte package must not contain React.
 *
 * Core is shared at source level and src/core mixes framework-neutral files with
 * React-coupled ones, so one wrong import would carry React into every Svelte
 * consumer. vendor-core.js refuses such files at copy time; this checks the
 * built output, which is what actually ships. */
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { resolve, join, relative } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const DIST = resolve(ROOT, 'packages/svelte/dist')

if (!existsSync(DIST)) {
  console.error('FAIL: packages/svelte/dist does not exist — run `npm run build:svelte` first.')
  process.exit(1)
}

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)])
}

const files = walk(DIST).filter(f => /\.(js|svelte|d\.ts)$/.test(f))

// Denominator check: an empty dist would otherwise pass with zero hits.
if (files.length < 5) {
  console.error(`FAIL: only ${files.length} code file(s) in dist — refusing to report a pass.`)
  process.exit(1)
}

const NEEDLES = [
  /from\s+['"]react(-dom)?(\/[^'"]*)?['"]/,
  /require\(\s*['"]react(-dom)?['"]\s*\)/,
  /\buseState\b/, /\buseEffect\b/, /\buseLayoutEffect\b/, /\bforwardRef\b/, /\bcreatePortal\b/,
]

// Positive control: the needles must match known-bad samples.
for (const sample of [`import { useState } from 'react'`, `import { createPortal } from "react-dom"`]) {
  if (!NEEDLES.some(n => n.test(sample))) {
    console.error(`FAIL: needles do not match known-bad sample ${sample} — the gate is broken.`)
    process.exit(1)
  }
}

let bad = 0
for (const f of files) {
  // Comments legitimately name React APIs to explain what a Svelte file mirrors;
  // what ships as code is what matters.
  const code = readFileSync(f, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^\s*\/\/.*$/gm, '')
  for (const n of NEEDLES) {
    const m = code.match(n)
    if (m) { console.error(`FAIL: ${relative(ROOT, f)} contains ${JSON.stringify(m[0])}`); bad++ }
  }
}
if (bad) process.exit(1)
console.log(`OK: no React in ${files.length} shipped code files.`)
