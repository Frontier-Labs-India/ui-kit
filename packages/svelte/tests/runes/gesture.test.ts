import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/svelte'
import Probe from './gesture-probe.svelte'

beforeEach(() => { vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] }); vi.setSystemTime(1_000_000) })
afterEach(() => { vi.useRealTimers() })

const at = (el: Element, type: string, x: number, y: number) =>
  el.dispatchEvent(new MouseEvent(type, { clientX: x, clientY: y, bubbles: true }))

describe('useGesture (Svelte twin)', () => {
  it('reports swipe direction and velocity (px/s)', () => {
    const onSwipe = vi.fn()
    const { container } = render(Probe, { props: { handlers: { onSwipe } } })
    const g = container.querySelector('.g')!
    at(g, 'pointerdown', 0, 0); vi.advanceTimersByTime(100); at(g, 'pointerup', 0, -60)
    expect(onSwipe).toHaveBeenLastCalledWith('up', 600)
    at(g, 'pointerdown', 0, 0); vi.advanceTimersByTime(200); at(g, 'pointerup', -40, 10)
    expect(onSwipe.mock.calls[1][0]).toBe('left')
    at(g, 'pointerdown', 0, 0); vi.advanceTimersByTime(100); at(g, 'pointerup', 20, 0) // too short
    expect(onSwipe).toHaveBeenCalledTimes(2)
  })

  it('long press fires after 500ms unless the pointer moves or lifts', () => {
    const onLongPress = vi.fn()
    const { container } = render(Probe, { props: { handlers: { onLongPress } } })
    const g = container.querySelector('.g')!
    at(g, 'pointerdown', 5, 6); vi.advanceTimersByTime(499)
    expect(onLongPress).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(onLongPress).toHaveBeenCalledWith(5, 6)
    at(g, 'pointerup', 5, 6)
    at(g, 'pointerdown', 5, 6); at(g, 'pointermove', 6, 6); vi.advanceTimersByTime(600)
    expect(onLongPress).toHaveBeenCalledOnce()
  })

  it('double tap: two quick nearby taps fire once; a slow second tap starts over', () => {
    const onDoubleTap = vi.fn()
    const { container } = render(Probe, { props: { handlers: { onDoubleTap } } })
    const g = container.querySelector('.g')!
    const tap = (x: number) => { at(g, 'pointerdown', x, 0); vi.advanceTimersByTime(50); at(g, 'pointerup', x, 0) }
    tap(10); vi.advanceTimersByTime(100); tap(20)
    expect(onDoubleTap).toHaveBeenCalledWith(20, 0)
    tap(10); vi.advanceTimersByTime(400); tap(10)
    expect(onDoubleTap).toHaveBeenCalledOnce()
  })
})
