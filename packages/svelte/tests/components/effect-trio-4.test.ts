import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import BackToTop from '../../src/components/BackToTop.svelte'
import StreamingText from '../../src/components/StreamingText.svelte'
import LiveFeed from '../../src/components/LiveFeed.svelte'

afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals() })

describe('BackToTop', () => {
  it('becomes visible past visibleFrom, tracks progress in a target, and scrolls it to the top', async () => {
    const target = document.createElement('div')
    Object.defineProperties(target, { scrollHeight: { value: 1100 }, clientHeight: { value: 100 } })
    target.scrollTo = vi.fn() as never
    const { container } = render(BackToTop, { props: { target, visibleFrom: 200, showProgress: true, smooth: false } })
    const button = container.querySelector('button')!
    expect(button.getAttribute('data-visible')).toBe('false')
    target.scrollTop = 500
    target.dispatchEvent(new Event('scroll'))
    flushSync()
    expect(button.getAttribute('data-visible')).toBe('true')
    const fill = container.querySelector('.ui-back-to-top__progress-fill')!
    const circumference = 2 * Math.PI * 21
    expect(Number(fill.getAttribute('stroke-dashoffset'))).toBeCloseTo(circumference * 0.5)
    await fireEvent.click(button)
    expect(target.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'instant' })
  })

  it('inherited: a caller onclick replaces the scroll, as React spreads it after its own handler', async () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    const onclick = vi.fn()
    const { container } = render(BackToTop, { props: { onclick } })
    await fireEvent.click(container.querySelector('button')!)
    expect(onclick).toHaveBeenCalledOnce()
    expect(scrollTo).not.toHaveBeenCalled()
    const plain = render(BackToTop, { props: {} })
    await fireEvent.click(plain.container.querySelector('button')!)
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
  })
})

describe('StreamingText', () => {
  it('keeps code block text exact (the contract collapses whitespace)', () => {
    const { container } = render(StreamingText, { props: { text: 'Run:\n```bash\nnpm i\n  --save\n```\nok' } })
    const code = container.querySelector('code')!
    expect(code.querySelector('.ui-streaming-text__code-lang')!.textContent).toBe('bash')
    expect(code.lastChild!.textContent).toBe('npm i\n  --save\n')
    expect(Array.from(container.querySelectorAll('.ui-streaming-text__content > span')).map(s => s.textContent)).toEqual(['Run:\n', '\nok'])
  })

  it('reveals `speed` characters per frame', () => {
    const queue = new Map<number, FrameRequestCallback>()
    let id = 0
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(f => { queue.set(++id, f); return id })
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(h => { queue.delete(h) })
    const step = () => { const n = queue.entries().next().value!; queue.delete(n[0]); n[1](0); flushSync() }
    const { container } = render(StreamingText, { props: { text: 'abcdefg', speed: 3 } })
    const text = () => container.querySelector('.ui-streaming-text__content')!.textContent
    expect(text()).toBe('')
    step()
    expect(text()).toBe('abc')
    step()
    step()
    expect(text()).toBe('abcdefg')
    expect(queue.size).toBe(0)
  })

  it('when streaming stops: fades the cursor for 300ms and calls onComplete once', async () => {
    vi.useFakeTimers()
    const onComplete = vi.fn()
    const { container, rerender } = render(StreamingText, { props: { text: 'x', streaming: true, onComplete } })
    await rerender({ text: 'xy', streaming: false, onComplete })
    flushSync()
    expect(onComplete).toHaveBeenCalledOnce()
    expect(container.querySelector('.ui-streaming-text__cursor')!.getAttribute('data-fading')).toBe('true')
    vi.advanceTimersByTime(300)
    flushSync()
    expect(container.querySelector('.ui-streaming-text__cursor')).toBeNull()
  })
})

describe('LiveFeed', () => {
  it('scrolls to the newest item when items grow, unless paused or autoScroll is off', async () => {
    const make = (n: number) => Array.from({ length: n }, (_, i) => ({ id: String(i), content: `e${i}`, timestamp: 0 }))
    const setTop = vi.fn()
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(999)
    const { container, rerender } = render(LiveFeed, { props: { items: make(1) } })
    const scroll = container.querySelector<HTMLElement>('.ui-live-feed__scroll')!
    Object.defineProperty(scroll, 'scrollTop', { set: setTop, configurable: true })
    await rerender({ items: make(2) })
    flushSync()
    expect(setTop).toHaveBeenCalledWith(999)
    await rerender({ items: make(3), paused: true })
    flushSync()
    await rerender({ items: make(4), autoScroll: false })
    flushSync()
    expect(setTop).toHaveBeenCalledOnce()
  })
})
