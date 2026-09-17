import { createAttachmentKey } from 'svelte/attachments'

/* COMPONENT-API.md rule 1. Where React's component clones the caller's element
 * to add attributes and handlers, the Svelte component passes them to the
 * caller's snippet, which spreads them: `<button {...props}>`. */

/** What a trigger snippet receives: attributes, `on*` handlers and an attachment. */
export type TriggerProps = Record<string, unknown> & Record<symbol, (node: Element) => void | (() => void)>

/**
 * An attachment, under a symbol key, that reports the element the caller
 * spreads it onto: `set(node)` when attached, `set(null)` when removed.
 * Create it once per component instance and spread it into every props object;
 * a stable function keeps Svelte from re-attaching on each update.
 */
export function captureElement(set: (element: Element | null) => void): Record<symbol, (node: Element) => () => void> {
  return { [createAttachmentKey()]: (node: Element) => { set(node); return () => set(null) } }
}

/**
 * Adds your own props to a trigger's props. Spreading your `onclick` after
 * theirs would replace the component's handler, so handlers present on both
 * sides are chained: the component's first, then yours, the order React uses
 * when it wraps a child's onClick. `class` values are joined. Anything else in
 * `own` replaces the component's value; attachments from both are kept.
 */
export function mergeProps<T extends Record<string | symbol, unknown>, U extends Record<string, unknown>>(props: T, own: U): Omit<T, keyof U> & U {
  const out: Record<string | symbol, unknown> = { ...props }
  for (const [key, value] of Object.entries(own)) {
    const theirs = props[key]
    if (/^on[a-z]/.test(key) && typeof theirs === 'function' && typeof value === 'function') {
      out[key] = (...args: unknown[]) => { theirs(...args); value(...args) }
    } else if (key === 'class' && typeof theirs === 'string' && typeof value === 'string') {
      out[key] = `${theirs} ${value}`
    } else {
      out[key] = value
    }
  }
  return out as Omit<T, keyof U> & U
}
