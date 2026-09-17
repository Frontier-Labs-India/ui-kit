#!/usr/bin/env node
/* No `style:` directives and no `style` attributes on DOM elements in .svelte
 * markup.
 *
 * `style:` is refused because Svelte applies its FIRST value through
 * element.style.cssText, which `style-src 'self'` blocks; later updates go
 * through setProperty and work. So it is dead on first paint and fine after —
 * invisible in a component that updates, permanently wrong in one that doesn't.
 *
 * A `style` attribute on an element is inline CSS and blocked outright. React's
 * style={{…}} is NOT blocked — react-dom writes it with setProperty — so a
 * faithful transcription of CSP-clean React is CSP-broken Svelte. That
 * asymmetry is what this catches. Dynamic styles go through use:cssProps.
 *
 * Parsed with Svelte's own compiler, not matched by line: a `style` PROP on a
 * component (<Skeleton style={{…}} />) is just data the component applies with
 * setProperty, and a line regex cannot tell it from an attribute on an element.
 * The first version flagged exactly that. */
import { readFileSync, readdirSync } from 'node:fs'
import { resolve, join, relative } from 'node:path'
import { parse } from 'svelte/compiler'

const ROOT = resolve(import.meta.dirname, '..')
const SRC = resolve(ROOT, 'packages/svelte/src')

const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(e => {
  const p = join(dir, e.name)
  return e.isDirectory() ? walk(p) : p.endsWith('.svelte') ? [p] : []
})

/** Violations in one component's markup: [line, message]. */
export function violations(source) {
  const ast = parse(source, { modern: true })
  const found = []
  const lineOf = i => source.slice(0, i).split('\n').length
  // `onElement` is true only while visiting the attribute list of a DOM element
  // (RegularElement or SvelteElement) — never a Component's.
  const visit = (node, onElement) => {
    if (!node || typeof node !== 'object') return
    if (node.type === 'StyleDirective') found.push([lineOf(node.start), `style:${node.name} directive — use use:cssProps`])
    if (node.type === 'Attribute' && node.name === 'style' && onElement) {
      found.push([lineOf(node.start), 'style attribute on an element — use a class, or use:cssProps for dynamic values'])
    }
    const isDomElement = node.type === 'RegularElement' || node.type === 'SvelteElement'
    for (const [k, v] of Object.entries(node)) {
      if (k === 'parent' || k === 'metadata') continue
      const childOnElement = k === 'attributes' && isDomElement
      if (Array.isArray(v)) v.forEach(c => visit(c, childOnElement))
      else if (v && typeof v === 'object') visit(v, childOnElement)
    }
  }
  visit(ast.fragment, false)
  return found
}

const files = walk(SRC)
if (files.length === 0) {
  console.error('FAIL: no .svelte files found — refusing to report a pass.')
  process.exit(1)
}

// Positive and negative controls on the analyser itself.
const control = violations('<div style="color:red"></div><span style:color={c}></span><svelte:element this={t} style="x"></svelte:element>')
const clean = violations('<Skeleton style={{ position: "absolute" }} /><div use:cssProps={{ a: 1 }}></div>')
if (control.length !== 3 || clean.length !== 0) {
  console.error(`FAIL: analyser controls wrong (expected 3 and 0, got ${control.length} and ${clean.length}) — the gate is broken.`)
  process.exit(1)
}

let bad = 0
for (const f of files) {
  for (const [line, msg] of violations(readFileSync(f, 'utf8'))) {
    console.error(`FAIL: ${relative(ROOT, f)}:${line} ${msg}`)
    bad++
  }
}
if (bad) process.exit(1)
console.log(`OK: ${files.length} .svelte files, no style: directives, no style attributes on elements.`)
