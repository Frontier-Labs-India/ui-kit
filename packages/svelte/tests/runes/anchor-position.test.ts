import { describe, it, expect, vi, afterEach } from 'vitest'
import { render } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import Probe from './anchor-probe.svelte'
import { computeAnchorPosition } from '../../src/vendor/core/a11y/compute-anchor-position.js'

afterEach(() => vi.restoreAllMocks())

let triggerTop = 100
function mockRects() {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    return (this.classList.contains('t')
      ? { top: triggerTop, bottom: triggerTop + 20, left: 50, right: 150, width: 100, height: 20, x: 50, y: triggerTop }
      : { top: 0, bottom: 30, left: 0, right: 80, width: 80, height: 30, x: 0, y: 0 }) as DOMRect
  })
}
const read = (c: HTMLElement) => {
  const f = c.querySelector('.f') as HTMLElement
  return { x: Number(f.dataset.x), y: Number(f.dataset.y), placement: f.dataset.placement }
}
const expected = (placement: 'top' | 'bottom', offset = 8) => {
  const t = document.querySelector('.t')!.getBoundingClientRect()
  const f = document.querySelector('.f')!.getBoundingClientRect()
  return computeAnchorPosition(t, f, window, { placement, align: 'center', offset })
}

describe('useAnchorPosition (Svelte twin)', () => {
  it('computes with the shared maths on mount and follows scroll', () => {
    triggerTop = 100
    mockRects()
    const { container } = render(Probe)
    const first = expected('bottom')
    expect(read(container)).toMatchObject({ x: first.x, y: first.y, placement: first.placement })
    triggerTop = 300
    window.dispatchEvent(new Event('scroll'))
    flushSync()
    expect(read(container).y).toBe(expected('bottom').y)
    expect(read(container).y).not.toBe(first.y)
  })

  it('re-runs when config changes', async () => {
    triggerTop = 400
    mockRects()
    const { container, rerender } = render(Probe, { props: { placement: 'bottom' } })
    await rerender({ placement: 'top', offset: 20 })
    flushSync()
    expect(read(container)).toMatchObject({ y: expected('top', 20).y, placement: expected('top', 20).placement })
  })

  it('removes its listeners when disabled and when destroyed', async () => {
    mockRects()
    const add = vi.spyOn(window, 'addEventListener')
    const remove = vi.spyOn(window, 'removeEventListener')
    const disconnect = vi.fn()
    vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() { disconnect() } })
    try {
      const { rerender, unmount } = render(Probe)
      const scrolls = add.mock.calls.filter(c => c[0] === 'scroll').map(c => c[1])
      expect(scrolls).toHaveLength(1)
      await rerender({ enabled: false })
      flushSync()
      expect(remove.mock.calls.filter(c => c[0] === 'scroll').map(c => c[1])).toEqual(scrolls)
      expect(disconnect).toHaveBeenCalledOnce()
      await rerender({ enabled: true })
      flushSync()
      unmount()
      expect(disconnect).toHaveBeenCalledTimes(2)
      expect(remove.mock.calls.filter(c => c[0] === 'resize')).toHaveLength(2)
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
