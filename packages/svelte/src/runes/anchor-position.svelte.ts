import { computeAnchorPosition, type AnchorPositionResult } from '../vendor/core/a11y/compute-anchor-position.js'

export type AnchorPlacement = 'top' | 'bottom' | 'left' | 'right'

/* Svelte twin of useAnchorPosition (src/core/a11y/anchor-position.ts).
 *
 * Call during component init. Every argument is a getter: the elements do not
 * exist until mount (`() => el` for a bind:this), and config is read inside the
 * effect so later prop changes re-run it. While enabled and both elements
 * exist, the position is computed with the vendored computeAnchorPosition —
 * the function React's hook calls — then kept current on trigger resize and
 * window scroll/resize, and those listeners are removed when disabled or
 * destroyed. Returns reactive fields (x, y, width, placement). */
export function useAnchorPosition(
  trigger: () => Element | null | undefined,
  floating: () => Element | null | undefined,
  config: () => { placement?: AnchorPlacement; align?: 'center' | 'start' | 'end'; offset?: number; enabled?: boolean } = () => ({}),
): Readonly<AnchorPositionResult> {
  let position = $state<AnchorPositionResult>({ x: 0, y: 0, width: 0, placement: config().placement ?? 'bottom' })

  $effect(() => {
    const { placement = 'bottom', align = 'center', offset = 8, enabled = true } = config()
    if (!enabled) return
    const t = trigger()
    const f = floating()
    if (!t || !f) return

    const update = () => {
      position = computeAnchorPosition(t.getBoundingClientRect(), f.getBoundingClientRect(), window, { placement, align, offset })
    }
    update()

    const ro = new ResizeObserver(update)
    ro.observe(t)
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update, { passive: true })
    return () => {
      ro.disconnect()
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  })

  return {
    get x() { return position.x },
    get y() { return position.y },
    get width() { return position.width },
    get placement() { return position.placement },
  }
}
