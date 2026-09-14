import { useEffect, useState, type RefObject } from 'react'

export interface AnchorPositionResult {
  x: number
  y: number
  width: number
  placement: 'top' | 'bottom' | 'left' | 'right'
}

export interface AnchorPositionConfig {
  placement?: 'top' | 'bottom' | 'left' | 'right'
  align?: 'center' | 'start' | 'end'
  offset?: number
}

/**
 * The positioning maths, with no framework in it — a pure function of two
 * rects and a viewport. Extracted so the Svelte package can share it rather
 * than duplicate it; `useAnchorPosition` below is the React binding over it.
 *
 * Kept as a separate export rather than inlined because a duplicated copy in
 * another package would drift silently, and flip-when-off-screen is exactly
 * the behaviour nobody re-derives correctly a second time.
 */
export function computeAnchorPosition(
  triggerRect: { top: number; bottom: number; left: number; right: number; width: number; height: number },
  floatingRect: { width: number; height: number },
  viewport: { innerWidth: number; innerHeight: number },
  config: AnchorPositionConfig = {}
): AnchorPositionResult {
  const { placement = 'bottom', align = 'center', offset = 8 } = config

  let x = 0
  let y = 0
  let finalPlacement = placement

  const alignX = () => {
    if (align === 'start') return triggerRect.left
    if (align === 'end') return triggerRect.right - floatingRect.width
    return triggerRect.left + (triggerRect.width - floatingRect.width) / 2
  }

  switch (placement) {
    case 'bottom':
      x = alignX()
      y = triggerRect.bottom + offset
      // Flip if off screen
      if (y + floatingRect.height > viewport.innerHeight) {
        y = triggerRect.top - floatingRect.height - offset
        finalPlacement = 'top'
      }
      break
    case 'top':
      x = alignX()
      y = triggerRect.top - floatingRect.height - offset
      if (y < 0) {
        y = triggerRect.bottom + offset
        finalPlacement = 'bottom'
      }
      break
    case 'right':
      x = triggerRect.right + offset
      y = triggerRect.top + (triggerRect.height - floatingRect.height) / 2
      break
    case 'left':
      x = triggerRect.left - floatingRect.width - offset
      y = triggerRect.top + (triggerRect.height - floatingRect.height) / 2
      break
  }

  // Clamp to viewport
  x = Math.max(8, Math.min(x, viewport.innerWidth - floatingRect.width - 8))

  return { x, y, width: triggerRect.width, placement: finalPlacement }
}

export function useAnchorPosition(
  triggerRef: RefObject<Element | null>,
  floatingRef: RefObject<Element | null>,
  config: {
    placement?: 'top' | 'bottom' | 'left' | 'right'
    align?: 'center' | 'start' | 'end'
    offset?: number
    enabled?: boolean
  } = {}
): AnchorPositionResult {
  const { placement = 'bottom', align = 'center', offset = 8, enabled = true } = config
  const [position, setPosition] = useState<AnchorPositionResult>({ x: 0, y: 0, width: 0, placement })

  useEffect(() => {
    if (!enabled) return

    const trigger = triggerRef.current
    const floating = floatingRef.current
    if (!trigger || !floating) return

    const update = () => {
      setPosition(
        computeAnchorPosition(
          trigger.getBoundingClientRect(),
          floating.getBoundingClientRect(),
          window,
          { placement, align, offset }
        )
      )
    }

    update()

    const resizeObserver = new ResizeObserver(update)
    resizeObserver.observe(trigger)
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update, { passive: true })

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [triggerRef, floatingRef, placement, align, offset, enabled])

  return position
}

export function supportsAnchorPositioning(): boolean {
  return typeof CSS !== 'undefined' && CSS.supports?.('anchor-name', '--a') === true
}
