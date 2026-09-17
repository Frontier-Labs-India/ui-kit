/* Shared by the React ref-fixture generator and the Svelte ref test, so both
 * sides describe an element the same way. See scripts/generate-ref-fixtures.tsx. */
export type RefTarget = null | 'outside' | { tag: string; classes: string; nth: number }

export function describeElement(container: Element, el: unknown): RefTarget {
  if (el == null) return null
  if (!(el instanceof Element)) throw new Error(`ref holds a ${typeof el}, not an element`)
  // A portalled element: identified only as living outside the render container.
  if (!container.contains(el)) return 'outside'
  const classes = classSet(el)
  const same = [...container.querySelectorAll(el.tagName)].filter(e => classSet(e) === classes)
  return { tag: el.tagName.toLowerCase(), classes, nth: same.indexOf(el) }
}

function classSet(el: Element): string {
  return [...el.classList].sort().join(' ')
}
