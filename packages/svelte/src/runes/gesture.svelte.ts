/* Svelte twin of useGesture (src/core/input/gestures.ts).
 *
 * Pointer-event swipe (> 30px in < 300ms), long press (500ms without moving)
 * and double tap (two taps < 300ms and < 30px apart), with React's thresholds.
 * Handlers are read when an event fires, so the latest callbacks are always
 * used; React gets the same by re-subscribing on every handler change. The
 * tap/press state lives outside the effect and survives re-subscription, as
 * React's ref does. */
export interface GestureHandlers {
  onSwipe?: (direction: 'left' | 'right' | 'up' | 'down', velocity: number) => void
  onLongPress?: (x: number, y: number) => void
  onDoubleTap?: (x: number, y: number) => void
}

export function useGesture(element: () => Element | null | undefined, handlers: () => GestureHandlers): void {
  const state = {
    startX: 0, startY: 0, startTime: 0,
    lastTapTime: 0, lastTapX: 0, lastTapY: 0,
    longPressTimer: null as ReturnType<typeof setTimeout> | null,
  }
  const clearPress = () => {
    if (state.longPressTimer) { clearTimeout(state.longPressTimer); state.longPressTimer = null }
  }

  $effect(() => {
    const el = element()
    if (!el) return

    const onDown = (e: Event) => {
      const pe = e as PointerEvent
      state.startX = pe.clientX
      state.startY = pe.clientY
      state.startTime = Date.now()
      if (handlers().onLongPress) {
        state.longPressTimer = setTimeout(() => handlers().onLongPress?.(pe.clientX, pe.clientY), 500)
      }
    }

    const onUp = (e: Event) => {
      const pe = e as PointerEvent
      clearPress()
      const { onSwipe, onDoubleTap } = handlers()
      const dx = pe.clientX - state.startX
      const dy = pe.clientY - state.startY
      const dt = (Date.now() - state.startTime) / 1000
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance > 30 && dt < 0.3 && onSwipe) {
        const velocity = distance / dt
        if (Math.abs(dx) > Math.abs(dy)) onSwipe(dx > 0 ? 'right' : 'left', velocity)
        else onSwipe(dy > 0 ? 'down' : 'up', velocity)
      }

      if (onDoubleTap && dt < 0.3 && distance < 10) {
        const now = Date.now()
        if (now - state.lastTapTime < 300 && Math.abs(pe.clientX - state.lastTapX) < 30 && Math.abs(pe.clientY - state.lastTapY) < 30) {
          onDoubleTap(pe.clientX, pe.clientY)
          state.lastTapTime = 0
        } else {
          state.lastTapTime = now
          state.lastTapX = pe.clientX
          state.lastTapY = pe.clientY
        }
      }
    }

    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointermove', clearPress)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointermove', clearPress)
      clearPress()
    }
  })
}
