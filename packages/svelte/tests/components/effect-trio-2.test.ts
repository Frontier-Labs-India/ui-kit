import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import RealtimeValue from '../../src/components/RealtimeValue.svelte'
import ScrollReveal from '../../src/components/ScrollReveal.svelte'
import EvervaultCard from '../../src/components/EvervaultCard.svelte'

afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals() })

function frames() {
  const queue = new Map<number, FrameRequestCallback>()
  let id = 0
  let now = 0
  vi.spyOn(performance, 'now').mockImplementation(() => now)
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation(f => { queue.set(++id, f); return id })
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(h => { queue.delete(h) })
  return {
    step(ms: number) { now += ms; const next = queue.entries().next().value; if (next) { queue.delete(next[0]); next[1](now); flushSync() } },
    pending: () => queue.size,
  }
}

describe('RealtimeValue', () => {
  it('flashes the direction for 600ms and eases over 200ms at motion 1 (400ms at 2+)', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const f = frames()
    const format = (v: number) => v.toFixed(1)
    const { container, rerender } = render(RealtimeValue, { props: { value: 10, motion: 1, format } })
    const root = container.querySelector('.ui-realtime-value')!
    const num = () => container.querySelector('.ui-realtime-value__number')!.textContent
    await rerender({ value: 20, motion: 1, format })
    flushSync()
    expect(root.getAttribute('data-flash')).toBe('up')
    f.step(100)
    expect(num()).toBe((10 + 10 * (1 - Math.pow(0.5, 3))).toFixed(1))
    f.step(100)
    expect(num()).toBe('20.0')
    expect(f.pending()).toBe(0)
    vi.advanceTimersByTime(600)
    flushSync()
    expect(root.hasAttribute('data-flash')).toBe(false)
    await rerender({ value: 5, motion: 2, format })
    flushSync()
    expect(root.getAttribute('data-flash')).toBe('down')
    f.step(200)
    expect(num()).not.toBe('5.0') // halfway through 400ms
    f.step(200)
    expect(num()).toBe('5.0')
  })

  it('jumps without flashing at motion 0; flashOnChange=false keeps the easing only', async () => {
    const f = frames()
    const a = render(RealtimeValue, { props: { value: 1, motion: 0 } })
    await a.rerender({ value: 2, motion: 0 })
    flushSync()
    expect(a.container.querySelector('.ui-realtime-value__number')!.textContent).toBe('2')
    expect(a.container.querySelector('[data-flash]')).toBeNull()
    const b = render(RealtimeValue, { props: { value: 1, motion: 1, flashOnChange: false } })
    await b.rerender({ value: 2, motion: 1, flashOnChange: false })
    flushSync()
    expect(b.container.querySelector('[data-flash]')).toBeNull()
    expect(f.pending()).toBe(1)
  })
})

describe('ScrollReveal', () => {
  function stubObserver() {
    const made: { cb: IntersectionObserverCallback; options: IntersectionObserverInit; disconnect: ReturnType<typeof vi.fn> }[] = []
    vi.stubGlobal('IntersectionObserver', class {
      disconnect = vi.fn()
      constructor(cb: IntersectionObserverCallback, options: IntersectionObserverInit) { made.push({ cb, options, disconnect: this.disconnect }) }
      observe() {}
    })
    return made
  }
  const fire = (o: { cb: IntersectionObserverCallback }, isIntersecting: boolean) => {
    o.cb([{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver)
    flushSync()
  }

  it('reveals on intersection with the given threshold and disconnects when once', () => {
    const made = stubObserver()
    const { container } = render(ScrollReveal, { props: { threshold: 0.4 } })
    const root = container.querySelector('.ui-scroll-reveal')!
    expect(made[0].options).toEqual({ threshold: 0.4 })
    expect(root.hasAttribute('data-revealed')).toBe(false)
    fire(made[0], true)
    expect(root.getAttribute('data-revealed')).toBe('true')
    expect(made[0].disconnect).toHaveBeenCalled()
  })

  it('once=false hides again on leaving', () => {
    const made = stubObserver()
    const { container } = render(ScrollReveal, { props: { once: false } })
    const root = container.querySelector('.ui-scroll-reveal')!
    fire(made[0], true)
    fire(made[0], false)
    expect(root.hasAttribute('data-revealed')).toBe(false)
    expect(made[0].disconnect).not.toHaveBeenCalled()
  })

  it('is revealed at once at motion 0 and where CSS scroll timelines are supported', () => {
    const made = stubObserver()
    const a = render(ScrollReveal, { props: { motion: 0 } })
    expect(a.container.querySelector('[data-revealed]')).not.toBeNull()
    vi.stubGlobal('CSS', { supports: (p: string, v: string) => p === 'animation-timeline' && v === 'view()' })
    const b = render(ScrollReveal, { props: {} })
    expect(b.container.querySelector('[data-revealed]')).not.toBeNull()
    expect(made).toHaveLength(0)
  })
})

describe('EvervaultCard', () => {
  it('scrambles while hovered, tracks the pointer, and stops on leave; nothing moves at motion 0', async () => {
    const f = frames()
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ left: 10, top: 20 } as DOMRect)
    const onmouseenter = vi.fn()
    const { container } = render(EvervaultCard, { props: { onmouseenter } })
    const card = container.querySelector<HTMLElement>('.ui-evervault-card')!
    const matrix = () => container.querySelector('.ui-evervault-card--matrix')!.textContent
    const before = matrix()
    expect(container.querySelectorAll('.ui-evervault-card--char')).toHaveLength(600)
    await fireEvent.mouseEnter(card)
    expect(onmouseenter).toHaveBeenCalledOnce()
    expect(card.getAttribute('data-hovering')).toBe('true')
    f.step(16)
    expect(matrix()).not.toBe(before)
    await fireEvent.mouseMove(card, { clientX: 110, clientY: 70 })
    expect(card.style.getPropertyValue('--ev-x')).toBe('100px')
    expect(card.style.getPropertyValue('--ev-y')).toBe('50px')
    await fireEvent.mouseLeave(card)
    expect(card.hasAttribute('data-hovering')).toBe(false)
    expect(f.pending()).toBe(0)

    const still = render(EvervaultCard, { props: { motion: 0 } })
    const s = still.container.querySelector<HTMLElement>('.ui-evervault-card')!
    await fireEvent.mouseEnter(s)
    await fireEvent.mouseMove(s, { clientX: 50, clientY: 50 })
    expect(s.style.getPropertyValue('--ev-x')).toBe('')
    expect(f.pending()).toBe(0)
  })
})
