#!/usr/bin/env node
/* No `style:` directives and no static `style=` attributes in .svelte markup.
 *
 * `style:` is refused because Svelte applies its FIRST value through
 * element.style.cssText, which `style-src 'self'` blocks; later updates go
 * through setProperty and work. So it is dead on first paint and fine after —
 * invisible in a component that updates, permanently wrong in one that doesn't.
 *
 * A static style="…" is plain inline CSS and blocked outright. React's
 * style={{…}} is NOT blocked — react-dom writes it with setProperty — so a
 * faithful transcription of CSP-clean React is CSP-broken Svelte. That
 * asymmetry is what this catches. Dynamic styles go through use:cssProps.
 *
 * Modelled on /srv/frontier-labs/webmail/tools/svelte/csp-boot-test.mjs. */
import { readFileSync, readdirSync } from 'node:fs'
import { resolve, join, relative } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const SRC = resolve(ROOT, 'packages/svelte/src')

const STYLE_DIRECTIVE = /\sstyle:[a-zA-Z-]/
const STATIC_STYLE = /\sstyle\s*=\s*["'{]/

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = join(dir, e.name)
    return e.isDirectory() ? walk(p) : p.endsWith('.svelte') ? [p] : []
  })
}

const files = walk(SRC)
if (files.length === 0) {
  console.error('FAIL: no .svelte files found — refusing to report a pass.')
  process.exit(1)
}
for (const [re, sample] of [[STYLE_DIRECTIVE, '<div style:color={c}>'], [STATIC_STYLE, '<div style="color:red">'], [STATIC_STYLE, '<div style={s}>']]) {
  if (!re.test(sample)) {
    console.error(`FAIL: pattern does not match known-bad sample ${sample} — the gate is broken.`)
    process.exit(1)
  }
}

let bad = 0
for (const f of files) {
  // Markup only: script and style blocks and comments are removed, keeping
  // line numbers stable by replacing with the same count of newlines.
  const blank = m => m.replace(/[^\n]/g, '')
  const markup = readFileSync(f, 'utf8')
    .replace(/<script[\s\S]*?<\/script>/g, blank)
    .replace(/<style[\s\S]*?<\/style>/g, blank)
    .replace(/<!--[\s\S]*?-->/g, blank)
  markup.split('\n').forEach((line, i) => {
    const at = `${relative(ROOT, f)}:${i + 1}`
    if (STYLE_DIRECTIVE.test(line)) { console.error(`FAIL: ${at} uses a style: directive — use use:cssProps`); bad++ }
    if (STATIC_STYLE.test(line)) { console.error(`FAIL: ${at} has a style attribute — use a class, or use:cssProps for dynamic values`); bad++ }
  })
}
if (bad) process.exit(1)
console.log(`OK: ${files.length} .svelte files, no style: directives, no style attributes.`)
