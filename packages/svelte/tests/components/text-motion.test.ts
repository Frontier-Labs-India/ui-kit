import { describe, it, expect, vi, afterEach } from 'vitest'
import { render } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import FlipWords from '../../src/components/FlipWords.svelte'
import TextReveal from '../../src/components/TextReveal.svelte'
import AnimatedCounter from '../../src/components/AnimatedCounter.svelte'
import { solveSpring } from '../../src/vendor/core/motion/spring.js'

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks() })

const advance = (ms: number) => { vi.advanceTimersByTime(ms); flushSync() }

describe('FlipWords', () => {
  it('cycles exit (400ms) → next word entering → visible (50ms) every interval, and wraps', () => {
    vi.useFakeTimers()
    const { container, unmount } = render(FlipWords, { props: { words: ['a', 'b'], interval: 1000 } })
    const word = () => container.querySelector('.ui-flip-words--word')!
    expect([word().textContent, word().getAttribute('data-state')]).toEqual(['a', 'visible'])
    advance(1000)
    expect(word().getAttribute('data-state')).toBe('exiting')
    advance(400)
    expect([word().textContent, word().getAttribute('data-state')]).toEqual(['b', 'entering'])
    advance(50)
    expect(word().getAttribute('data-state')).toBe('visible')
    advance(550 + 400)
    expect(word().textContent).toBe('a')
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('does not cycle at motion 0 or with one word', () => {
    vi.useFakeTimers()
    render(FlipWords, { props: { words: ['a', 'b'], motion: 0 } })
    render(FlipWords, { props: { words: ['only'] } })
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe('TextReveal', () => {
  const revealed = (c: HTMLElement) => c.querySelectorAll('[data-revealed]').length

  it('reveals one character per 1000/speed ms from mount', () => {
    vi.useFakeTimers()
    const { container } = render(TextReveal, { props: { text: 'abc', speed: 10 } })
    expect(revealed(container)).toBe(0)
    advance(100)
    expect(revealed(container)).toBe(1)
    // Each character's timer is scheduled by the effect after the previous one lands.
    advance(100)
    advance(100)
    expect(revealed(container)).toBe(3)
    advance(100)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('reveals everything at once at motion 0', () => {
    const { container } = render(TextReveal, { props: { text: 'a b', motion: 0 } })
    expect(revealed(container)).toBe(3)
    expect(container.querySelector('[data-space]')!.textContent).toBe(' ')
  })

  it('inView waits for 10% intersection, then disconnects', () => {
    vi.useFakeTimers()
    let cb: IntersectionObserverCallback | undefined
    let options: IntersectionObserverInit | undefined
    const disconnect = vi.fn()
    vi.stubGlobal('IntersectionObserver', class { constructor(c: IntersectionObserverCallback, o: IntersectionObserverInit) { cb = c; options = o } observe() {} disconnect() { disconnect() } })
    const { container } = render(TextReveal, { props: { text: 'ab', trigger: 'inView', speed: 10 } })
    expect(options).toEqual({ threshold: 0.1 })
    advance(500)
    expect(revealed(container)).toBe(0)
    cb!([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver)
    flushSync()
    expect(disconnect).toHaveBeenCalled()
    advance(100)
    advance(100)
    expect(revealed(container)).toBe(2)
  })
})

describe('AnimatedCounter', () => {
  function frames() {
    const queue: FrameRequestCallback[] = []
    let now = 0
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(f => { queue.push(f); return queue.length })
    const cancel = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
    return { step(ms: number) { now += ms; const f = queue.shift(); f?.(now); flushSync() }, cancel }
  }

  it('eases from the previous value at motion 1, writing frames to the text, then commits', async () => {
    const f = frames()
    const { container, rerender } = render(AnimatedCounter, { props: { value: 0, motion: 1, duration: 100 } })
    const span = container.querySelector('span')!
    await rerender({ value: 1000, motion: 1, duration: 100 })
    flushSync()
    f.step(50)
    expect(span.textContent).toBe(new Intl.NumberFormat().format(Math.round(1000 * (1 - Math.pow(0.5, 3)))))
    f.step(50)
    expect(span.textContent).toBe('1,000')
  })

  it('jumps at motion 0, and cancels a running animation when the value changes again', async () => {
    const f = frames()
    const a = render(AnimatedCounter, { props: { value: 1, motion: 0 } })
    await a.rerender({ value: 5, motion: 0 })
    flushSync()
    expect(a.container.textContent).toBe('5')

    const b = render(AnimatedCounter, { props: { value: 0, motion: 3, duration: 100, format: (v: number) => v.toFixed(0) } })
    await b.rerender({ value: 10, motion: 3, duration: 100, format: (v: number) => v.toFixed(0) })
    flushSync()
    await b.rerender({ value: 20, motion: 3, duration: 100, format: (v: number) => v.toFixed(0) })
    flushSync()
    expect(f.cancel).toHaveBeenCalled()
  })

  it('motion ≥ 2 follows the spring curve (not the ease-out) and ends exactly on the value', async () => {
    const f = frames()
    const format = (v: number) => v.toFixed(3)
    const { container, rerender } = render(AnimatedCounter, { props: { value: 0, motion: 2, duration: 100, format } })
    await rerender({ value: 300, motion: 2, duration: 100, format })
    flushSync()
    f.step(25)
    const curve = solveSpring({ stiffness: 120, damping: 14, mass: 1 })
    const expected = 300 * curve[Math.min(Math.floor(0.25 * (curve.length - 1)), curve.length - 1)]
    expect(container.querySelector('span')!.textContent).toBe(expected.toFixed(3))
    expect(expected.toFixed(3)).not.toBe((300 * (1 - Math.pow(0.75, 3))).toFixed(3))
    for (let i = 0; i < 4; i++) f.step(25)
    expect(container.querySelector('span')!.textContent).toBe('300.000')
  })
})
