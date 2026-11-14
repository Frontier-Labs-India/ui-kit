/* React's <select value>: when no option matches the value, react-dom selects
 * the first enabled option (updateOptions in react-dom-client), as a browser
 * does with React's server HTML. Svelte's own select binding instead sets
 * selectedIndex to -1, a blank select. This applies React's fallback after
 * Svelte has applied the value; the parameter lists what the selection
 * depends on (value and options), so it re-runs when they change.
 *
 *   <select value={v} use:reactSelectFallback={[v, options]}>
 */
export function reactSelectFallback(node: HTMLSelectElement, _deps?: unknown) {
  const apply = () => {
    if (node.multiple || node.selectedIndex !== -1) return
    const first = Array.from(node.options).find(o => !o.disabled)
    if (first) first.selected = true
  }
  apply()
  return { update: apply }
}
