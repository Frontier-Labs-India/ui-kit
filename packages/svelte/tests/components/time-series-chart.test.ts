import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import TimeSeriesChart from '../../src/components/TimeSeriesChart.svelte'

afterEach(() => { vi.restoreAllMocks(); cleanup() })

const T0 = 1768478400000
const series = [
  { id: 'cpu', label: 'CPU', data: [0, 1, 2, 3].map(i => ({ timestamp: T0 + i * 60000, value: 10 + i })) },
  { id: 'mem', label: 'Mem', data: [0, 2].map(i => ({ timestamp: T0 + i * 60000, value: 50 })) },
]
// Chart at the viewport origin, 400 wide: plot x from 52 to 384 (332px) over 3 minutes.
function mockRect() {
  vi.spyOn(SVGElement.prototype, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, right: 400, bottom: 200, width: 400, height: 200 } as DOMRect)
}
const hit = (c: HTMLElement) => c.querySelector('.ui-time-series-chart__hit-area')!
const mouse = (el: Element, type: string, clientX: number, clientY = 50) => {
  el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientX, clientY }))
  flushSync()
}
const tip = () => document.body.querySelector<HTMLElement>(':scope > .ui-time-series-chart__tooltip-box')

describe('TimeSeriesChart', () => {
  it('hover snaps to the nearest timestamp: crosshair, dots, and a portalled tooltip clamped inside the chart', () => {
    mockRect()
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(100)
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(40)
    const { container } = render(TimeSeriesChart, { props: { series } })
    mouse(hit(container), 'mousemove', 390, 100) // nearest: last point (x 384)
    // The tooltip mounts on this first move and is placed on the next — as in React,
    // whose ref is still null during the move that opens it.
    expect([tip()!.style.left, tip()!.style.top]).toEqual(['-9999px', '-9999px'])
    mouse(hit(container), 'mousemove', 390, 100)
    expect(container.querySelector('.ui-time-series-chart__crosshair')!.getAttribute('x1')).toBe('384')
    expect(container.querySelectorAll('.ui-time-series-chart__dot')).toHaveLength(1) // mem has no point at 3 min
    expect(tip()!.querySelector('.ui-time-series-chart__tooltip-time')!.textContent).toBe('12:03')
    expect(Array.from(tip()!.querySelectorAll('.ui-time-series-chart__tooltip-row')).map(r => r.textContent)).toEqual(['CPU: 13'])
    expect([tip()!.style.left, tip()!.style.top]).toEqual(['296px', '48px']) // clamped to right - width - 4
    mouse(hit(container), 'mouseleave', 0)
    expect(tip()).toBeNull()
  })

  it('toggleable legend hides a series line and its hover dot (the tooltip still lists it, as in React)', async () => {
    mockRect()
    const { container } = render(TimeSeriesChart, { props: { series, toggleableSeries: true } })
    expect(container.querySelectorAll('.ui-time-series-chart__series-line')).toHaveLength(2)
    await fireEvent.click(container.querySelector('[aria-label="Toggle CPU"]')!)
    expect(container.querySelectorAll('.ui-time-series-chart__series-line')).toHaveLength(1)
    mouse(hit(container), 'mousemove', 52) // first timestamp: both series have a point
    expect(Array.from(container.querySelectorAll('.ui-time-series-chart__dot')).map(d => d.getAttribute('fill'))).toEqual(['oklch(72% 0.19 155)'])
    expect(tip()!.querySelectorAll('.ui-time-series-chart__tooltip-row')).toHaveLength(2)
    mouse(hit(container), 'mouseleave', 0)
    expect(container.querySelector<HTMLElement>('.ui-time-series-chart__legend-item')!.style.opacity).toBe('0.4')
    await fireEvent.click(container.querySelector('[aria-label="Toggle CPU"]')!)
    expect(container.querySelectorAll('.ui-time-series-chart__series-line')).toHaveLength(2)
  })

  it('brushing reports the selected time range; tiny drags are ignored', () => {
    mockRect()
    const onBrush = vi.fn()
    const { container } = render(TimeSeriesChart, { props: { series, brushable: true, onBrush, showTooltip: false } })
    mouse(hit(container), 'mousedown', 52)
    mouse(hit(container), 'mousemove', 218)
    expect(container.querySelector('.ui-time-series-chart__brush')!.getAttribute('width')).toBe('166')
    mouse(hit(container), 'mouseup', 218)
    const [a, b] = onBrush.mock.calls[0][0] as [number, number]
    expect([a, Math.round(b)]).toEqual([T0, T0 + 90000])
    expect(container.querySelector('.ui-time-series-chart__brush')).toBeNull()
    mouse(hit(container), 'mousedown', 100)
    mouse(hit(container), 'mousemove', 102)
    mouse(hit(container), 'mouseup', 102)
    expect(onBrush).toHaveBeenCalledOnce()
  })

  it('wheel zooms around the pointer, shows Reset zoom, and zooming back out resets', async () => {
    mockRect()
    const onZoom = vi.fn()
    const { container } = render(TimeSeriesChart, { props: { series, zoomable: true, onZoom } })
    const svg = container.querySelector('svg')!
    const wheel = (deltaY: number) => {
      const e = new WheelEvent('wheel', { deltaY, clientX: 218, cancelable: true })
      svg.dispatchEvent(e)
      flushSync()
      return e
    }
    expect(wheel(-1).defaultPrevented).toBe(true)
    const [x0, x1] = onZoom.mock.calls[0][0].x as [number, number]
    expect(x1 - x0).toBeCloseTo(180000 / 1.15, 0)
    expect(container.querySelector('.ui-time-series-chart__zoom-reset')).not.toBeNull()
    wheel(1)
    wheel(1)
    expect(onZoom).toHaveBeenLastCalledWith(expect.objectContaining({ x: [T0, T0 + 180000] }))
    expect(container.querySelector('.ui-time-series-chart__zoom-reset')).toBeNull()
    wheel(-1)
    await fireEvent.click(container.querySelector('.ui-time-series-chart__zoom-reset')!)
    expect(onZoom).toHaveBeenLastCalledWith(expect.objectContaining({ x: [T0, T0 + 180000] }))
  })

  it('takes its width from the observed container', () => {
    let cb: ResizeObserverCallback | undefined
    vi.stubGlobal('ResizeObserver', class { constructor(c: ResizeObserverCallback) { cb = c } observe() {} disconnect() {} })
    try {
      const { container } = render(TimeSeriesChart, { props: { series } })
      cb!([{ contentRect: { width: 800 } } as ResizeObserverEntry], {} as ResizeObserver)
      flushSync()
      expect(container.querySelector('svg')!.getAttribute('viewBox')).toBe('0 0 800 200')
      cb!([{ contentRect: { width: 0 } } as ResizeObserverEntry], {} as ResizeObserver)
      flushSync()
      expect(container.querySelector('svg')!.getAttribute('width')).toBe('800')
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
