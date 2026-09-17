import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent } from '@testing-library/svelte'
import { createRawSnippet, flushSync } from 'svelte'
import TruncatedText from '../../src/components/TruncatedText.svelte'
import Ripple from '../../src/components/Ripple.svelte'
import RackDiagram from '../../src/components/RackDiagram.svelte'

afterEach(() => vi.useRealTimers())

describe('TruncatedText', () => {
  it('expands and collapses; the title tooltip only shows while truncated', async () => {
    const { container } = render(TruncatedText, { props: { text: 'long text', expandable: true } })
    const root = container.querySelector('.ui-truncated-text')!
    const btn = container.querySelector('button')!
    expect(root.getAttribute('title')).toBe('long text')
    await fireEvent.click(btn); flushSync()
    expect(btn.textContent).toBe('Show less')
    expect(btn.getAttribute('aria-expanded')).toBe('true')
    expect(root.hasAttribute('title')).toBe(false)
    await fireEvent.click(btn); flushSync()
    expect(btn.textContent).toBe('Show more')
  })
})

describe('Ripple', () => {
  const children = createRawSnippet(() => ({ render: () => '<b>x</b>' }))

  it('adds a sized ripple at the pointer and removes it after the duration', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout'] })
    const onclick = vi.fn()
    const { container } = render(Ripple, { props: { children, duration: 400, onclick } })
    const el = container.querySelector('.ui-ripple') as HTMLElement
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({ left: 10, top: 20, width: 100, height: 40 } as DOMRect)
    await fireEvent.click(el, { clientX: 60, clientY: 40 }); flushSync()
    const c = container.querySelector('.ui-ripple--circle') as HTMLElement
    expect(onclick).toHaveBeenCalledOnce()
    expect([c.style.insetInlineStart, c.style.insetBlockStart, c.style.inlineSize]).toEqual(['0px', '-30px', '100px']) // x: 60-10-50, y: 40-20-50
    vi.advanceTimersByTime(400); flushSync()
    expect(container.querySelector('.ui-ripple--circle')).toBeNull()
  })

  it('adds no ripple at motion 0 but still calls onclick', async () => {
    const onclick = vi.fn()
    const { container } = render(Ripple, { props: { children, motion: 0, onclick } })
    await fireEvent.click(container.querySelector('.ui-ripple')!); flushSync()
    expect(container.querySelector('.ui-ripple--circle')).toBeNull()
    expect(onclick).toHaveBeenCalledOnce()
  })
})

describe('RackDiagram', () => {
  it('shows a tooltip naming the unit range on hover and hides it on leave', async () => {
    const { container } = render(RackDiagram, { props: { units: 10, devices: [{ startU: 3, heightU: 2, label: 'sw1', status: 'warning' }] } })
    const dev = container.querySelector('.ui-rack-diagram__device')!
    await fireEvent.mouseEnter(dev); flushSync()
    expect(container.querySelector('.ui-rack-diagram__tooltip')!.textContent).toBe('sw1 — U3-4 (warning)')
    await fireEvent.mouseLeave(dev); flushSync()
    expect(container.querySelector('.ui-rack-diagram__tooltip')).toBeNull()
  })
})
