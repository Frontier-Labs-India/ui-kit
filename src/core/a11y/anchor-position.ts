import { useEffect, useState, type RefObject } from 'react'
import { computeAnchorPosition, type AnchorPositionResult } from './compute-anchor-position'

export { computeAnchorPosition, type AnchorPositionResult, type AnchorPositionConfig } from './compute-anchor-position'

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
