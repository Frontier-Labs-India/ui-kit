import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent } from '@testing-library/svelte'
import { flushSync, tick } from 'svelte'
import Probe from './copy-button-probe.svelte'
import NumberTicker from '../../src/components/NumberTicker.svelte'

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })

describe('CopyButton', () => {
  it('writes the value, flips copied for `timeout`, restarts the timer on a second copy, and calls onclick', async () => {
    vi.useFakeTimers()
    const writeText = vi.fn(() => Promise.resolve())
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    const onclick = vi.fn()
    const { container, unmount } = render(Probe, { props: { value: 'npm i x', timeout: 1000, onclick } })
    const button = container.querySelector('button')!
    await fireEvent.click(button)
    await tick()
    flushSync()
    expect(writeText).toHaveBeenCalledWith('npm i x')
    expect(onclick).toHaveBeenCalledOnce()
    expect(button.getAttribute('aria-label')).toBe('Copied')
    expect(button.hasAttribute('data-copied')).toBe(true)
    expect(container.querySelector('.state')!.textContent).toBe('Copied!')
    vi.advanceTimersByTime(800)
    // The snippet's copy() restarts the timer.
    container.querySelector<HTMLElement>('.again')!.click()
    await tick()
    vi.advanceTimersByTime(800)
    flushSync()
    expect(container.querySelector('.state')!.textContent).toBe('Copied!')
    vi.advanceTimersByTime(200)
    flushSync()
    expect(button.getAttribute('aria-label')).toBe('Copy to clipboard')
    await fireEvent.click(button)
    await tick()
    // One timer here is the environment's own; destroying the button clears the copied timer.
    const before = vi.getTimerCount()
    unmount()
    expect(vi.getTimerCount()).toBe(before - 1)
  })

  it('does nothing without a clipboard API', async () => {
    vi.stubGlobal('navigator', {})
    const { container } = render(Probe)
    await fireEvent.click(container.querySelector('button')!)
    expect(container.querySelector('button')!.hasAttribute('data-copied')).toBe(false)
  })
})

describe('NumberTicker', () => {
  const structure = (c: HTMLElement) =>
    Array.from(c.querySelector('.ui-number-ticker')!.children).map(el =>
      el.classList.contains('ui-number-ticker--static')
        ? `static:${el.textContent}`
        : `digit:${(el.firstElementChild as HTMLElement).style.transform}:${el.firstElementChild!.firstElementChild!.textContent}`)

  it('renders a static slot for separators and signs, and a translated digit column per digit', () => {
    const { container } = render(NumberTicker, { props: { value: -1204 } })
    expect(structure(container)).toEqual([
      'static:-', 'digit:translateY(-1em):0', 'static:,', 'digit:translateY(-2em):0', 'digit:translateY(0em):0', 'digit:translateY(-4em):0',
    ])
    expect(container.querySelector('.ui-number-ticker')!.getAttribute('aria-label')).toBe('-1204')
  })

  it('down reverses the column and its offset', () => {
    const { container } = render(NumberTicker, { props: { value: 7, direction: 'down' } })
    expect(structure(container)).toEqual(['digit:translateY(-2em):9'])
  })

  it('delays only the first value; later changes show at once', async () => {
    vi.useFakeTimers()
    const { container, rerender } = render(NumberTicker, { props: { value: 5, delay: 300 } })
    const digits = () => container.querySelectorAll('.ui-number-ticker--digit-slot').length
    expect(container.querySelector('.ui-number-ticker--digit-column')!.getAttribute('style')).toContain('translateY(0em)') // "0"
    vi.advanceTimersByTime(300)
    flushSync()
    expect((container.querySelector('.ui-number-ticker--digit-column') as HTMLElement).style.transform).toBe('translateY(-5em)')
    await rerender({ value: 42, delay: 300 })
    flushSync()
    expect(digits()).toBe(2)
  })
})
