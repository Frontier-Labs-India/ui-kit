import { createRawSnippet, type Component } from 'svelte'
import Compose from './Compose.svelte'
import { PROP_RENAMES, UNIVERSAL_RENAMES } from './divergences.js'

/* The one Svelte-side reading of the case encoding in cases.ts (React's side is
 * the fixture generators). Kept in one place: every suite rendering cases must
 * read `$el` the same way, or they test different markup. */

export function renamed(name: string, props: unknown): Record<string, unknown> {
  const out = { ...(props as Record<string, unknown>) }
  for (const { from, to } of [...UNIVERSAL_RENAMES, ...(PROP_RENAMES[name] ?? [])]) {
    if (from in out) { out[to] = out[from]; delete out[from] }
  }
  return out
}

export function hydrate(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(hydrate)
  if (value && typeof value === 'object') {
    const v = value as Record<string, unknown>
    if ('$el' in v) return element(String(v.$el))
    if ('$fn' in v) return () => {}
    if ('$date' in v) return new Date(String(v.$date))
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, hydrate(x)]))
  }
  return value
}

type SpreadProps = Record<string | symbol, unknown>

/* `{ $el: 'x' }` is `<b>x</b>`, as React's generator renders it. A component
 * following COMPONENT-API.md rule 1 calls the snippet with the props React's
 * cloneElement would add; they are applied as the caller's `{...props}` spread
 * would apply them: attributes, `on*` listeners, attachments (symbol keys). */
function element(text: string) {
  const escaped = text.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!)
  return createRawSnippet((props?: () => SpreadProps | undefined) => ({
    render: () => `<b>${escaped}</b>`,
    setup(node) {
      // Only rule-1 props are spread: they always carry an attachment under a
      // symbol key. Other snippet parameters (ContainerQuery's size, a
      // DashboardTemplate section) are data the caller reads, not attributes.
      if (!props) return
      $effect(() => {
        const p = props()
        if (p && typeof p === 'object' && Object.getOwnPropertySymbols(p).length > 0) return applySpread(node as Element, p)
      })
    },
  }))
}

function applySpread(node: Element, props: SpreadProps): () => void {
  const cleanups: (() => void)[] = []
  for (const key of Reflect.ownKeys(props)) {
    const value = props[key]
    if (typeof key === 'symbol') {
      if (typeof value === 'function') {
        const cleanup = value(node)
        if (typeof cleanup === 'function') cleanups.push(cleanup)
      }
    } else if (key.startsWith('on') && typeof value === 'function') {
      const type = key.slice(2)
      node.addEventListener(type, value as EventListener)
      cleanups.push(() => node.removeEventListener(type, value as EventListener))
    } else if (value == null || value === false) {
      node.removeAttribute(key)
    } else {
      node.setAttribute(key, value === true ? '' : String(value))
    }
  }
  return () => cleanups.forEach(c => c())
}

export type PartNode = { $part: string; props?: Record<string, unknown> }

export function isPartList(value: unknown): value is PartNode[] {
  return Array.isArray(value) && value.some(v => v && typeof v === 'object' && '$part' in v)
}

/**
 * What to render for a case: the component with hydrated props, or, when the
 * case's `children` is a list of `{ $part }` nodes (COMPONENT-API.md rules 2-3),
 * Compose rendering the component with those parts inside. `target` receives
 * the component's bindable `ref`.
 */
export function caseRender(Comp: Component<any>, name: string, raw: unknown, target: { ref: unknown } = { ref: null }): { component: Component<any>; props: Record<string, unknown> } {
  const { children, ...rest } = renamed(name, raw)
  if (isPartList(children)) {
    return { component: Compose, props: { component: Comp, rootProps: hydrate(rest), parts: children, target } }
  }
  const props = hydrate({ ...rest, ...(children === undefined ? {} : { children }) }) as Record<string, unknown>
  Object.defineProperty(props, 'ref', { get: () => target.ref, set: v => { target.ref = v }, enumerable: true, configurable: true })
  return { component: Comp, props }
}
