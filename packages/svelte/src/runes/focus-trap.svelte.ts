/* Svelte twin of useFocusTrap (src/core/a11y/focus-trap.ts).
 *
 * Call during component init with getters. While active and the container
 * exists: remember the focused element, move focus in ('first', or the element
 * an initialFocus getter returns), wrap Tab and Shift+Tab at the ends, and on
 * deactivation or destroy remove the listener and return focus unless
 * returnFocus is false. Same selector and order as React. */
export interface FocusTrapConfig {
  active: boolean
  returnFocus?: boolean
  initialFocus?: 'first' | (() => HTMLElement | null | undefined)
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function useFocusTrap(container: () => HTMLElement | null | undefined, config: () => FocusTrapConfig): void {
  $effect(() => {
    const { active, returnFocus, initialFocus } = config()
    if (!active) return
    const el = container()
    if (!el) return

    const previousFocus = document.activeElement as HTMLElement | null
    const getFocusable = () => Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE))

    const focusable = getFocusable()
    const initial = typeof initialFocus === 'function' ? initialFocus() : null
    if (initialFocus === 'first' && focusable[0]) focusable[0].focus()
    else if (initial) initial.focus()
    else focusable[0]?.focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const elements = getFocusable()
      if (elements.length === 0) return
      const first = elements[0]
      const last = elements[elements.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    el.addEventListener('keydown', onKeyDown)
    return () => {
      el.removeEventListener('keydown', onKeyDown)
      if (returnFocus !== false && previousFocus) previousFocus.focus()
    }
  })
}
