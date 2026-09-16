/* Inline style for a `style-src 'self'` origin.
 *
 * `setAttribute("style", …)` and `element.style.cssText = …` are bulk style
 * writes and are refused exactly as a <style> block is. Individual property
 * writes are DOM API calls, not inline CSS, and are allowed.
 *
 * Svelte's own `style:` directive applies its FIRST value through cssText, so
 * it is blocked on first paint and works on every update after — dead in a
 * component that never updates, fine in one that does. That is why this action
 * exists and `style:` is banned repo-wide; see check-svelte-csp.js.
 *
 *   <div use:cssProps={{ "--depth": n, height: px + "px" }}>
 */

export type CssPropValue = string | number | null | undefined

export function cssProps(node: HTMLElement | SVGElement, props: Record<string, CssPropValue>) {
  let applied: Record<string, CssPropValue> = {}

  const apply = (next: Record<string, CssPropValue> = {}) => {
    // Remove anything set last time that is gone or nulled now.
    for (const key of Object.keys(applied)) {
      if (!(key in next) || next[key] == null) node.style.removeProperty(key)
    }
    for (const [key, value] of Object.entries(next)) {
      if (value == null) continue
      // setProperty, never cssText — see the note above.
      node.style.setProperty(key, String(value))
    }
    applied = { ...next }
  }

  apply(props)

  return {
    update: apply,
    destroy() {
      for (const key of Object.keys(applied)) node.style.removeProperty(key)
    },
  }
}
