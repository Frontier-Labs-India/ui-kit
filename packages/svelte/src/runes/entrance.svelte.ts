import { getMotionLevel } from './motion-level.svelte.js'

export type EntranceAnimation = 'fade' | 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right' | 'scale' | 'none'

/* Svelte twin of useEntrance (src/core/motion/use-entrance.ts).
 *
 * Call during component init with getters, as React's hook is called during
 * render. The element is a getter too — pass `() => el` for a `bind:this` —
 * because it does not exist until mount.
 *
 * Same sequence as React: hide (opacity 0 plus an offset), wait `delay`,
 * transition in over `duration`, then clear every property it set and report
 * entered. Callers pass 'none' below their own motion threshold, which is how
 * a component's motion prop is honoured; the context level is read here, as
 * React's hook reads it. Styles are written through the CSSOM (one property at
 * a time), which style-src 'self' permits. */
export function useEntrance(
  element: () => HTMLElement | null | undefined,
  animation: () => EntranceAnimation = () => 'fade-up',
  options: () => { delay?: number; duration?: number; once?: boolean } = () => ({}),
): { readonly entered: boolean } {
  const motionLevel = getMotionLevel()
  let entered = $state(false)
  let hasEntered = false

  $effect(() => {
    const anim = animation()
    const { delay = 0, duration = 300, once = true } = options()
    if (motionLevel() === 0 || anim === 'none') {
      entered = true
      return
    }
    if (once && hasEntered) return
    const el = element()
    if (!el) return

    el.style.setProperty('opacity', '0')
    const offset = anim.includes('up') ? 'translateY(12px)'
      : anim.includes('down') ? 'translateY(-12px)'
      : anim.includes('left') ? 'translateX(12px)'
      : anim.includes('right') ? 'translateX(-12px)'
      : anim === 'scale' ? 'scale(0.95)'
      : null
    if (offset) el.style.setProperty('transform', offset)

    let settle: ReturnType<typeof setTimeout> | undefined
    const start = setTimeout(() => {
      el.style.setProperty('transition', `opacity ${duration}ms var(--ease-out, ease-out), transform ${duration}ms var(--ease-out, ease-out)`)
      el.style.setProperty('opacity', '1')
      el.style.setProperty('transform', 'none')
      settle = setTimeout(() => {
        el.style.removeProperty('transition')
        el.style.removeProperty('transform')
        el.style.removeProperty('opacity')
        entered = true
        hasEntered = true
      }, duration)
    }, delay)

    // Both timers, so neither fires on a detached node after teardown.
    return () => {
      clearTimeout(start)
      if (settle) clearTimeout(settle)
    }
  })

  return {
    get entered() {
      return entered
    },
  }
}
