/* Relocates a node, the way react-dom's createPortal does.
 *
 * Scoped styles survive this. `@scope (.ui-drawer)` matches on the element
 * carrying the class, and a scope root is not positional — moving the subtree
 * moves its scope root with it, so the scoped rules keep applying at the new
 * location. The design spec left this open; portal.test.ts asserts it.
 *
 * jsdom does not evaluate the @scope cascade, so the test asserts the
 * structural precondition — the root still matches, and its descendants still
 * resolve to it. Confirming the computed style belongs in the Playwright
 * visual suite.
 */

export function portal(node: HTMLElement, target: HTMLElement = document.body) {
  target.appendChild(node)
  return {
    destroy() {
      node.remove()
    },
  }
}
