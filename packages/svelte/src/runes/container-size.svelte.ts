import { getBreakpoint, type ContainerBreakpoint } from '../vendor/core/utils/container-breakpoints.js'

export interface ContainerSize {
  width: number
  height: number
  breakpoint: ContainerBreakpoint
}

/* Svelte twin of useContainerSize (src/core/utils/use-container-size.ts).
 *
 * Observes the element with ResizeObserver, coalesces bursts into one
 * animation frame, prefers borderBoxSize over contentRect, and leaves the
 * value untouched when the size is unchanged. Zeros until the first
 * observation, as React returns on the server and before mount. */
export function useContainerSize(element: () => HTMLElement | null | undefined): Readonly<ContainerSize> {
  let size = $state<ContainerSize>({ width: 0, height: 0, breakpoint: 'xs' })

  $effect(() => {
    const el = element()
    if (!el || typeof ResizeObserver === 'undefined') return
    let rafId: number | null = null
    const observer = new ResizeObserver(entries => {
      if (rafId !== null) cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        rafId = null
        const entry = entries[0]
        if (!entry) return
        const box = entry.borderBoxSize?.length ? entry.borderBoxSize[0] : null
        const w = box ? box.inlineSize : entry.contentRect.width
        const h = box ? box.blockSize : entry.contentRect.height
        if (size.width === w && size.height === h) return
        size = { width: w, height: h, breakpoint: getBreakpoint(w) }
      })
    })
    observer.observe(el)
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId)
      observer.disconnect()
    }
  })

  return {
    get width() { return size.width },
    get height() { return size.height },
    get breakpoint() { return size.breakpoint },
  }
}
