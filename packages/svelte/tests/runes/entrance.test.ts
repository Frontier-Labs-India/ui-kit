import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import Probe from './entrance-probe.svelte'

beforeEach(() => vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] }))
afterEach(() => vi.useRealTimers())

const el = (c: Element) => c.querySelector('div') as HTMLElement

describe('useEntrance', () => {
  it('hides with the offset, transitions in after delay, then clears everything it set', () => {
    const { container } = render(Probe, { props: { animation: 'fade-up', delay: 50, duration: 200 } })
    flushSync()
    expect(el(container).style.opacity).toBe('0')
    expect(el(container).style.transform).toBe('translateY(12px)')
    vi.advanceTimersByTime(50)
    expect(el(container).style.opacity).toBe('1')
    expect(el(container).style.transition).toContain('200ms')
    expect(el(container).getAttribute('data-entered')).toBe('false')
    vi.advanceTimersByTime(200)
    flushSync()
    expect([el(container).style.opacity, el(container).style.transform, el(container).style.transition]).toEqual(['', '', ''])
    expect(el(container).getAttribute('data-entered')).toBe('true')
  })

  it.each([
    ['fade-down', 'translateY(-12px)'], ['fade-left', 'translateX(12px)'],
    ['fade-right', 'translateX(-12px)'], ['scale', 'scale(0.95)'], ['fade', ''],
  ] as const)('%s starts from %s', (animation, transform) => {
    const { container } = render(Probe, { props: { animation } })
    flushSync()
    expect(el(container).style.transform).toBe(transform)
  })

  it("'none' enters immediately and touches no style", () => {
    const { container } = render(Probe, { props: { animation: 'none' } })
    flushSync()
    expect(el(container).getAttribute('data-entered')).toBe('true')
    expect(el(container).style.opacity).toBe('')
  })

  it('cancels both timers on unmount', () => {
    const { unmount } = render(Probe, { props: { delay: 10, duration: 10 } })
    flushSync()
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})
