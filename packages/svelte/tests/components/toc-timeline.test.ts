import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import TableOfContents from '../../src/components/TableOfContents.svelte'

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); document.body.querySelectorAll('section').forEach(s => s.remove()) })

const items = [
  { id: 's1', label: 'One', level: 1 },
  { id: 's2', label: 'Two', level: 1, children: [{ id: 's3', label: 'Three', level: 2 }] },
]
const active = (c: HTMLElement) => c.querySelector('[data-active]')?.getAttribute('data-id')

describe('TableOfContents', () => {
  it('click activates (uncontrolled), reports, and scrolls the section into view', async () => {
    const section = document.createElement('section')
    section.id = 's3'
    section.scrollIntoView = vi.fn()
    document.body.append(section)
    const onItemClick = vi.fn()
    const { container, getByText } = render(TableOfContents, { props: { items, onItemClick, motion: 0 } })
    await fireEvent.click(getByText('Three'))
    expect(active(container)).toBe('s3')
    expect(onItemClick).toHaveBeenCalledWith('s3')
    expect(section.scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto' })
  })

  it('controlled activeId is not changed by clicks', async () => {
    const { container, getByText } = render(TableOfContents, { props: { items, activeId: 's1' } })
    await fireEvent.click(getByText('Two'))
    expect(active(container)).toBe('s1')
  })

  it('moves the indicator to the active link, and hides it when nothing is active', async () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      return (this.tagName === 'UL' ? { top: 100, height: 300 } : { top: 100 + 30 * ['s1', 's2', 's3'].indexOf(this.dataset.id!), height: 30 }) as DOMRect
    })
    const { container, rerender } = render(TableOfContents, { props: { items, activeId: 's3' } })
    const indicator = container.querySelector<HTMLElement>('.ui-toc__indicator')!
    expect([indicator.style.transform, indicator.style.blockSize, indicator.style.opacity]).toEqual(['translateY(60px)', '30px', '1'])
    await rerender({ items, activeId: 'missing' })
    flushSync()
    expect(indicator.style.opacity).toBe('0')
  })

  it('scroll spy activates the topmost intersecting section', () => {
    for (const id of ['s1', 's2']) {
      const s = document.createElement('section')
      s.id = id
      document.body.append(s)
    }
    let cb: IntersectionObserverCallback | undefined
    let options: IntersectionObserverInit | undefined
    vi.stubGlobal('IntersectionObserver', class { constructor(c: IntersectionObserverCallback, o: IntersectionObserverInit) { cb = c; options = o } observe() {} disconnect() {} })
    const { container } = render(TableOfContents, { props: { items, scrollSpy: true, scrollOffset: 64 } })
    expect(options).toEqual({ rootMargin: '-64px 0px 0px 0px', threshold: [0, 0.5, 1] })
    const entry = (id: string, top: number, isIntersecting = true) =>
      ({ isIntersecting, target: document.getElementById(id)!, boundingClientRect: { top } }) as unknown as IntersectionObserverEntry
    // Topmost first, so picking the last intersecting entry would choose s2.
    cb!([entry('s1', -10), entry('s2', 40), entry('s1', -500, false)], {} as IntersectionObserver)
    flushSync()
    expect(active(container)).toBe('s1')
  })
})
