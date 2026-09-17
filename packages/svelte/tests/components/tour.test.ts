import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import Tour from '../../src/components/Tour.svelte'

afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); document.querySelectorAll('.target').forEach(e => e.remove()) })

function target(rect: Partial<DOMRect>) {
  const el = document.createElement('div')
  el.className = 'target'
  el.scrollIntoView = vi.fn()
  document.body.append(el)
  vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({ top: 0, left: 0, width: 0, height: 0, right: 0, bottom: 0, ...rect } as DOMRect)
  return el
}

describe('Tour', () => {
  it('spotlights the target and places the tooltip on each side, clamped to the viewport', async () => {
    vi.stubGlobal('innerWidth', 1000)
    vi.stubGlobal('innerHeight', 800)
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(300)
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(100)
    target({ top: 200, left: 400, width: 100, height: 50, right: 500, bottom: 250 })
    const steps = (placement: 'top' | 'bottom' | 'left' | 'right') => [{ target: '.target', title: 'T', description: 'd', placement }]
    const { container, rerender } = render(Tour, { props: { open: true, steps: steps('bottom') } })
    const tip = () => container.querySelector<HTMLElement>('.ui-tour__tooltip')!
    const spot = container.querySelector('.ui-tour__spotlight')!
    expect(['x', 'y', 'width', 'height'].map(a => spot.getAttribute(a))).toEqual(['392', '192', '116', '66'])
    expect([tip().style.top, tip().style.left]).toEqual(['266px', '300px'])
    await rerender({ open: true, steps: steps('top') })
    flushSync()
    expect(tip().style.top).toBe('84px')
    await rerender({ open: true, steps: steps('right') })
    flushSync()
    expect([tip().style.top, tip().style.left]).toEqual(['175px', '516px'])
    await rerender({ open: true, steps: steps('left') })
    flushSync()
    expect(tip().style.left).toBe('84px')
  })

  it('clamps the tooltip 8px inside the viewport', () => {
    vi.stubGlobal('innerWidth', 1000)
    vi.stubGlobal('innerHeight', 800)
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(300)
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(100)
    // Near the top-left corner: "left" would be off-screen left, "top" off-screen top.
    target({ top: 5, left: 10, width: 20, height: 20, right: 30, bottom: 25 })
    const a = render(Tour, { props: { open: true, steps: [{ target: '.target', title: 'T', description: 'd', placement: 'left' }] } })
    expect(a.container.querySelector<HTMLElement>('.ui-tour__tooltip')!.style.left).toBe('8px')
    const b = render(Tour, { props: { open: true, steps: [{ target: '.target', title: 'T', description: 'd', placement: 'top' }] } })
    expect(b.container.querySelector<HTMLElement>('.ui-tour__tooltip')!.style.top).toBe('8px')
  })

  it('centres the tooltip with a notice when the target is missing', () => {
    vi.stubGlobal('innerWidth', 1000)
    vi.stubGlobal('innerHeight', 800)
    const { container } = render(Tour, { props: { open: true, steps: [{ target: '#nope', title: 'T', description: 'd' }] } })
    expect(container.querySelector('.ui-tour__spotlight')).toBeNull()
    expect(container.textContent).toContain('Target element not found')
    const tip = container.querySelector<HTMLElement>('.ui-tour__tooltip')!
    expect([tip.style.top, tip.style.left]).toEqual(['400px', '500px'])
  })

  it('Next, Previous, Finish and Skip step through and close; onShow runs per step', async () => {
    target({})
    const onShow = vi.fn()
    const onClose = vi.fn()
    const onFinish = vi.fn()
    const onStepChange = vi.fn()
    const steps = [{ target: '.target', title: 'One', description: 'a', onShow }, { target: '.target', title: 'Two', description: 'b', onShow }]
    const { getByText, container } = render(Tour, { props: { open: true, steps, onClose, onFinish, onStepChange } })
    expect(onShow).toHaveBeenCalledOnce()
    await fireEvent.click(getByText('Next'))
    expect(onStepChange).toHaveBeenCalledWith(1)
    expect(container.querySelector('.ui-tour__title')!.textContent).toBe('Two')
    expect(onShow).toHaveBeenCalledTimes(2)
    expect(container.querySelector('[data-skip]')).toBeNull()
    await fireEvent.click(getByText('Previous'))
    await fireEvent.click(getByText('Skip'))
    expect(onClose).toHaveBeenCalledOnce()
    await fireEvent.click(getByText('Next'))
    await fireEvent.click(getByText('Finish'))
    expect(onFinish).toHaveBeenCalledOnce()
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('Escape and overlay close unless disabled', async () => {
    target({})
    const onClose = vi.fn()
    const steps = [{ target: '.target', title: 'One', description: 'a' }]
    const { container, rerender } = render(Tour, { props: { open: true, steps, onClose } })
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await fireEvent.click(container.querySelector('.ui-tour__overlay')!)
    expect(onClose).toHaveBeenCalledTimes(2)
    await rerender({ open: true, steps, onClose, closeOnEscape: false, closeOnOverlay: false })
    flushSync()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await fireEvent.click(container.querySelector('.ui-tour__overlay')!)
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('re-places 100ms after a resize, and stops listening when closed', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('innerHeight', 800)
    vi.stubGlobal('innerWidth', 1000)
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(100)
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(50)
    const el = target({ top: 100, left: 100, width: 10, height: 10, right: 110, bottom: 110 })
    const steps = [{ target: '.target', title: 'One', description: 'a' }]
    const { container, rerender } = render(Tour, { props: { open: true, steps } })
    const tip = () => container.querySelector<HTMLElement>('.ui-tour__tooltip')
    expect(tip()!.style.top).toBe('126px')
    vi.mocked(el.getBoundingClientRect).mockReturnValue({ top: 300, left: 100, width: 10, height: 10, right: 110, bottom: 310 } as DOMRect)
    window.dispatchEvent(new Event('resize'))
    vi.advanceTimersByTime(99)
    flushSync()
    expect(tip()!.style.top).toBe('126px')
    vi.advanceTimersByTime(1)
    flushSync()
    expect(tip()!.style.top).toBe('326px')
    const remove = vi.spyOn(window, 'removeEventListener')
    await rerender({ open: false, steps })
    flushSync()
    expect(remove.mock.calls.map(c => c[0])).toEqual(expect.arrayContaining(['scroll', 'resize']))
    expect(tip()).toBeNull()
  })
})
