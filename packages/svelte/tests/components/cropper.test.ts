import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import Cropper from '../../src/components/Cropper.svelte'

afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })

function loaded(props: Record<string, unknown>) {
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(400)
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(300)
  vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(800)
  vi.spyOn(HTMLImageElement.prototype, 'naturalHeight', 'get').mockReturnValue(600)
  const r = render(Cropper, { props: { src: 'a.png', ...props } })
  r.container.querySelector('img')!.dispatchEvent(new Event('load'))
  flushSync()
  return r
}
const area = (c: HTMLElement) => c.querySelector<HTMLElement>('.ui-cropper__crop-area')!
const box = (c: HTMLElement) => {
  const s = area(c).style
  return [s.getPropertyValue('inset-inline-start'), s.getPropertyValue('inset-block-start'), s.getPropertyValue('inline-size'), s.getPropertyValue('block-size')]
}
const pointer = (el: Element, type: string, clientX: number, clientY: number) => {
  el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientX, clientY }))
  flushSync()
}

describe('Cropper', () => {
  it('on load centres an 80% crop and reports it in image pixels a tick later', () => {
    vi.useFakeTimers()
    const onCrop = vi.fn()
    const { container } = loaded({ onCrop })
    expect(box(container)).toEqual(['40px', '30px', '320px', '240px'])
    expect(container.querySelector<HTMLElement>('.ui-cropper__overlay-right')!.style.width).toBe('40px')
    expect(container.querySelectorAll('.ui-cropper__handle')).toHaveLength(8)
    vi.runAllTimers()
    expect(onCrop).toHaveBeenLastCalledWith({ x: 80, y: 60, width: 640, height: 480, rotation: 0, zoom: 1 })
  })

  it('moving is clamped inside the container and reported on release', () => {
    const onCrop = vi.fn()
    const { container } = loaded({ onCrop })
    const c = container.querySelector('.ui-cropper__container')!
    pointer(area(container), 'pointerdown', 100, 100)
    pointer(c, 'pointermove', 400, 400)
    expect(box(container)).toEqual(['80px', '60px', '320px', '240px'])
    pointer(c, 'pointerup', 400, 400)
    expect(onCrop).toHaveBeenLastCalledWith({ x: 160, y: 120, width: 640, height: 480, rotation: 0, zoom: 1 })
    onCrop.mockClear()
    pointer(c, 'pointermove', 0, 0)
    expect(box(container)[0]).toBe('80px')
  })

  it('resizing from a corner keeps the aspect ratio and respects the minimum', () => {
    const { container } = loaded({ aspectRatio: 2, minWidth: 50, minHeight: 20 })
    expect(box(container)).toEqual(['40px', '70px', '320px', '160px'])
    const c = container.querySelector('.ui-cropper__container')!
    pointer(container.querySelector('.ui-cropper__handle--se')!, 'pointerdown', 0, 0)
    pointer(c, 'pointermove', -300, 0)
    expect(box(container).slice(2)).toEqual(['50px', '25px'])
    pointer(c, 'pointerup', 0, 0)
    // The bottom handle drives height, and width follows it (160 + 20 = 180 → 360 wide).
    pointer(container.querySelector('.ui-cropper__handle--s')!, 'pointerdown', 0, 0)
    pointer(c, 'pointermove', 0, 155)
    expect(box(container).slice(2)).toEqual(['360px', '180px'])
  })

  it('wheel zooms in 5% steps within 50–300% and rotation buttons turn by 90°, each reported', async () => {
    const onCrop = vi.fn()
    const { container } = loaded({ onCrop })
    const c = container.querySelector('.ui-cropper__container')!
    const wheel = new WheelEvent('wheel', { deltaY: -1, cancelable: true })
    c.dispatchEvent(wheel)
    flushSync()
    expect(wheel.defaultPrevented).toBe(true)
    expect(container.querySelector('img')!.style.transform).toBe('scale(1.05) rotate(0deg)')
    // Coordinates are reported unzoomed: 40px / 1.05 × 2 image px per container px.
    expect(onCrop).toHaveBeenLastCalledWith(expect.objectContaining({ zoom: 1.05, x: Math.round((40 / 1.05) * 2) }))
    for (let i = 0; i < 80; i++) c.dispatchEvent(new WheelEvent('wheel', { deltaY: 1, cancelable: true }))
    flushSync()
    expect(container.querySelector('img')!.style.transform).toBe('scale(0.5) rotate(0deg)')
    await fireEvent.click(container.querySelector('[aria-label="Rotate right 90 degrees"]')!)
    expect(container.querySelector('img')!.style.getPropertyValue('pointer-events')).toBe('none')
    expect(onCrop).toHaveBeenLastCalledWith(expect.objectContaining({ rotation: 90 }))
  })
})
