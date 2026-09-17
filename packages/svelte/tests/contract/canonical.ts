/* Reduces a DOM tree to a canonical text form so two independently rendered
 * trees — React's server HTML and Svelte's client DOM — compare equal exactly
 * when they carry the same contract.
 *
 * Normalised away (differences with no meaning):
 *   - attribute order, and class-token order
 *   - style formatting: "a:b;c:d" vs "a: b; c: d;" — declarations are parsed
 *     and sorted
 *   - comment nodes (React SSR separates adjacent text with <!-- -->), and
 *     whitespace-only text; adjacent text is merged and whitespace collapsed
 *   - generated id VALUES
 *   - how a checkbox's checked state is carried: server HTML has a `checked`
 *     attribute, a client render sets the `.checked` property and no attribute.
 *     Both mean the same, so an input's checked state is read from either.
 *   - likewise a text-like input's value: server HTML has `value="…"` (even
 *     `value=""`), a client render sets .value. Read from the property, and an
 *     empty value is the same as none. Checkbox and radio keep the attribute —
 *     there `value` is the submitted value, meaningful even when unchecked.
 *   - how a style value is spelled. Both trees' inline styles are read back
 *     through the same CSSOM rather than compared as text, so `0` vs `0px`,
 *     `oklch(65% 0.150 155)` vs `oklch(0.65 0.15 155)`, and spacing all
 *     normalise identically. Strictness holds: a value the CSSOM rejects on
 *     one side (a bare `width: 50`) is missing there and still fails.
 *
 * Kept (differences that matter):
 *   - every tag, attribute name and value, text, and the tree's shape
 *   - id RELATIONSHIPS. Ids become #1, #2… in order of first appearance, and
 *     reference attributes (for, aria-describedby, …) map through the same
 *     table — as do `url(#id)` references inside any attribute (clip-path,
 *     fill, mask, filter), which SVG uses to point at gradients and clips. Two correct implementations with different random ids compare
 *     equal; a label that points at the wrong element does not. */

const REF_ATTRS = new Set([
  'for', 'aria-describedby', 'aria-labelledby', 'aria-controls', 'aria-owns',
  'aria-activedescendant', 'aria-details', 'aria-errormessage', 'aria-flowto', 'headers', 'list', 'form',
])

/* Splits at top-level semicolons only — not inside url(…) or quotes. */
function declarations(style: string): string[] {
  const out: string[] = []
  let depth = 0, quote = '', start = 0
  for (let i = 0; i < style.length; i++) {
    const ch = style[i]
    if (quote) { if (ch === quote) quote = ''; continue }
    if (ch === '"' || ch === "'") quote = ch
    else if (ch === '(') depth++
    else if (ch === ')') depth = Math.max(0, depth - 1)
    else if (ch === ';' && depth === 0) { out.push(style.slice(start, i)); start = i + 1 }
  }
  out.push(style.slice(start))
  return out
}

/* Reads declarations back through a CSSOM so both trees normalise the same
 * way. A fresh element of the page's document is used — template content
 * lives in an inert document, but parsing is identical either way. */
function styleText(raw: string): string {
  const probe = document.createElement('div')
  probe.setAttribute('style', raw)
  /* Denominator: a declaration the CSSOM drops cannot be compared — it would be
   * missing from BOTH trees and pass unverified. Refuse loudly instead. (A
   * Svelte-side bug such as a bare `width: 50` never reaches this: setProperty
   * rejects it before it is written, so it is absent and fails the comparison.) */
  for (const decl of declarations(raw)) {
    const i = decl.indexOf(':')
    if (i < 1) continue
    const name = decl.slice(0, i).trim().toLowerCase()
    if (name && probe.style.getPropertyValue(name) === '') {
      throw new Error(`canonical: the CSSOM dropped "${decl.trim()}" — this declaration cannot be verified`)
    }
  }
  const out: string[] = []
  for (let i = 0; i < probe.style.length; i++) {
    const prop = probe.style.item(i)
    const priority = probe.style.getPropertyPriority(prop)
    out.push(`${prop}:${probe.style.getPropertyValue(prop)}${priority ? ' !' + priority : ''}`)
  }
  return out.sort().join(';')
}

export function canonical(root: ParentNode): string {
  const ids = new Map<string, string>()
  const token = (v: string) => {
    if (!ids.has(v)) ids.set(v, `#${ids.size + 1}`)
    return ids.get(v)!
  }
  const out: string[] = []

  const attrValue = (name: string, value: string): string => {
    if (name === 'id') return token(value)
    if (REF_ATTRS.has(name)) return value.trim().split(/\s+/).filter(Boolean).map(token).join(' ')
    if (value.includes('url(#')) value = value.replace(/url\(#([^)\s]+)\)/g, (_, id) => `url(${token(id)})`)
    if (name === 'class') return [...new Set(value.trim().split(/\s+/).filter(Boolean))].sort().join(' ')
    if (name === 'style') return styleText(value)
    return value
  }

  const walk = (node: ParentNode, depth: number) => {
    let text = ''
    const flush = () => {
      const t = text.replace(/\s+/g, ' ').trim()
      if (t) out.push(`${'  '.repeat(depth)}"${t}"`)
      text = ''
    }
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === 3) { text += child.textContent ?? ''; continue }
      if (child.nodeType === 8) continue // comments are transparent to text merging
      if (child.nodeType !== 1) continue
      flush()
      const el = child as Element
      const raw = Array.from(el.attributes)
        .map(a => [a.name.toLowerCase(), a.value] as const)
        .filter(([n]) => !(n === 'checked' && el instanceof HTMLInputElement))
      if (el instanceof HTMLInputElement && (el.checked || el.hasAttribute('checked'))) raw.push(['checked', ''])
      if (el instanceof HTMLInputElement && !['checkbox', 'radio'].includes(el.type)) {
        const i = raw.findIndex(([n]) => n === 'value')
        if (i >= 0) raw.splice(i, 1)
        const v = el.value || el.getAttribute('value') || ''
        if (v) raw.push(['value', v])
      }
      // id first, so a reference later on the same element resolves consistently
      const attrs = raw
        .sort(([a], [b]) => (a === 'id' ? -1 : b === 'id' ? 1 : a < b ? -1 : a > b ? 1 : 0))
        .map(([n, v]) => [n, attrValue(n, v)] as const)
        .filter(([n, v]) => !(n === 'class' && v === '') && !(n === 'style' && v === ''))
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([n, v]) => (v === '' ? n : `${n}="${v}"`))
      out.push(`${'  '.repeat(depth)}<${el.tagName.toLowerCase()}${attrs.length ? ' ' + attrs.join(' ') : ''}>`)
      walk(el, depth + 1)
    }
    flush()
  }

  walk(root, 0)
  return out.join('\n')
}

/** Parses server HTML into a detached tree for canonical(). */
export function fromHtml(html: string): ParentNode {
  const t = document.createElement('template')
  t.innerHTML = html
  return t.content
}
