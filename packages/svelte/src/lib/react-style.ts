/* React's style-object semantics, for porting components that merge style
 * objects — so a transcribed `{ width: size }` means what it meant in React.
 *
 * Mirrors react-dom's server serialisation (react-dom-server, pushStyleAttribute):
 *   - null, undefined, booleans and '' are skipped
 *   - `--custom` properties keep their name; the value is String(v).trim(),
 *     never given a unit
 *   - other names go camelCase -> kebab-case, with a leading `ms-` -> `-ms-`
 *   - a number becomes `${n}px`, unless it is 0 or the property is unitless
 *   - a string is trimmed
 * Verified against React rendering the same objects: tests/lib/react-style.test.ts. */
import { UNITLESS } from './unitless.generated.js'

export type StyleObject = Record<string, string | number | boolean | null | undefined>
export type StyleInput = StyleObject | string | null | undefined

function cssName(name: string): string {
  if (name.startsWith('--')) return name
  return name.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^ms-/, '-ms-')
}

/** Converts one React style object to CSS declarations. */
export function reactStyle(style: StyleObject | null | undefined): Record<string, string> {
  const out: Record<string, string> = {}
  if (!style) return out
  for (const [name, value] of Object.entries(style)) {
    if (value == null || typeof value === 'boolean' || value === '') continue
    if (name.startsWith('--')) { out[name] = String(value).trim(); continue }
    out[cssName(name)] =
      typeof value === 'number'
        ? value === 0 || UNITLESS.has(name) ? String(value) : `${value}px`
        : String(value).trim()
  }
  return out
}

/* Splits on `;` only at the top level — not inside parentheses or quotes, so
 * `url(data:image/png;base64,…)` and `content: "a;b"` survive intact. */
function splitDeclarations(style: string): string[] {
  const out: string[] = []
  let depth = 0
  let quote = ''
  let start = 0
  for (let i = 0; i < style.length; i++) {
    const c = style[i]
    if (quote) { if (c === quote && style[i - 1] !== '\\') quote = ''; continue }
    if (c === '"' || c === "'") quote = c
    else if (c === '(') depth++
    else if (c === ')') depth = Math.max(0, depth - 1)
    else if (c === ';' && depth === 0) { out.push(style.slice(start, i)); start = i + 1 }
  }
  out.push(style.slice(start))
  return out
}

/** Parses a CSS declaration string ("a: b; c: d") into declarations. */
export function parseStyle(style: string | null | undefined): Record<string, string> {
  const out: Record<string, string> = {}
  if (!style) return out
  for (const decl of splitDeclarations(style)) {
    const i = decl.indexOf(':')
    if (i < 1) continue
    const name = decl.slice(0, i).trim()
    const value = decl.slice(i + 1).trim()
    if (name && value) out[name.startsWith('--') ? name : name.toLowerCase()] = value
  }
  return out
}

/** Merges style sources left to right — later wins, as React's `{...a, ...b}`.
 *  Objects follow React semantics; strings are parsed as CSS. Apply the result
 *  with `use:cssProps`, which writes through setProperty, so a caller's own
 *  `style` is CSP-safe too. */
export function mergeStyles(...sources: StyleInput[]): Record<string, string> {
  return Object.assign({}, ...sources.map(s => (typeof s === 'string' ? parseStyle(s) : reactStyle(s))))
}
