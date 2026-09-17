import { describe, it, expect, vi, afterEach } from 'vitest'
import { render } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import * as pkg from '../../src/index.js'
import TextHighlightFile from '../../src/components/Highlight.svelte'
import HeroMark from '../../src/lib/HeroHighlightMark.svelte'

afterEach(() => { vi.unstubAllGlobals() })

describe('Highlight / TextHighlight public names', () => {
  it('match React: Highlight is the hero span, TextHighlight the text highlighter', () => {
    expect(pkg.Highlight).toBe(HeroMark)
    expect(pkg.TextHighlight).toBe(TextHighlightFile)
  })
})

describe('Highlight (hero)', () => {
  it('activates once 10% is in view, then disconnects; at once at motion 0', () => {
    let cb: IntersectionObserverCallback | undefined
    const disconnect = vi.fn()
    vi.stubGlobal('IntersectionObserver', class { constructor(c: IntersectionObserverCallback, public o: IntersectionObserverInit) { cb = c; expect(o).toEqual({ threshold: 0.1 }) } observe() {} disconnect() { disconnect() } })
    const { container } = render(HeroMark, { props: {} })
    const span = container.querySelector('.ui-highlight')!
    expect(span.hasAttribute('data-active')).toBe(false)
    cb!([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver)
    flushSync()
    expect(span.hasAttribute('data-active')).toBe(false)
    cb!([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver)
    flushSync()
    expect(span.getAttribute('data-active')).toBe('true')
    expect(disconnect).toHaveBeenCalled()

    const instant = render(HeroMark, { props: { motion: 0 } })
    expect(instant.container.querySelector('.ui-highlight')!.getAttribute('data-active')).toBe('true')
  })

  it('sets the brand colour custom property through the CSSOM', () => {
    const { container } = render(HeroMark, { props: { color: 'red', style: { fontWeight: 700 } } })
    const span = container.querySelector<HTMLElement>('.ui-highlight')!
    expect(span.style.getPropertyValue('--highlight-brand-color')).toBe('red')
    expect(span.style.getPropertyValue('font-weight')).toBe('700')
  })
})
