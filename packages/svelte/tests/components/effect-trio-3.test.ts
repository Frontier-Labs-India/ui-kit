import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import Spoiler from '../../src/components/Spoiler.svelte'
import InfiniteScroll from '../../src/components/InfiniteScroll.svelte'
import Affix from '../../src/components/Affix.svelte'

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); cleanup() })

describe('Spoiler', () => {
  it('shows a toggle only when content is taller than maxHeight, and animates max-height to the content', async () => {
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(300)
    const { container, getByRole } = render(Spoiler, { props: { maxHeight: 100 } })
    const content = container.querySelector<HTMLElement>('.ui-spoiler__content')!
    const root = container.querySelector('.ui-spoiler')!
    expect(content.style.maxHeight).toBe('100px')
    expect(root.getAttribute('data-state')).toBe('hidden')
    const toggle = getByRole('button', { name: 'Show more' })
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    await fireEvent.click(toggle)
    expect(content.style.maxHeight).toBe('300px')
    expect(root.getAttribute('data-state')).toBe('visible')
    expect(getByRole('button', { name: 'Show less' }).getAttribute('aria-expanded')).toBe('true')
  })

  it('re-measures when the content resizes', () => {
    let height = 50
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(() => height)
    let cb: ResizeObserverCallback | undefined
    vi.stubGlobal('ResizeObserver', class { constructor(c: ResizeObserverCallback) { cb = c } observe() {} disconnect() {} })
    const { container } = render(Spoiler, { props: { maxHeight: 100 } })
    expect(container.querySelector('.ui-spoiler__toggle')).toBeNull()
    height = 150
    cb!([], {} as ResizeObserver)
    flushSync()
    expect(container.querySelector('.ui-spoiler__toggle')).not.toBeNull()
  })
})

describe('InfiniteScroll', () => {
  function stubObserver() {
    const made: { cb: IntersectionObserverCallback; options?: IntersectionObserverInit; disconnect: ReturnType<typeof vi.fn> }[] = []
    vi.stubGlobal('IntersectionObserver', class {
      disconnect = vi.fn()
      constructor(cb: IntersectionObserverCallback, options?: IntersectionObserverInit) { made.push({ cb, options, disconnect: this.disconnect }) }
      observe() {}
    })
    return made
  }
  const intersect = (o: { cb: IntersectionObserverCallback }) => o.cb([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver)

  it('loads once per visit to the sentinel until loading clears, with rootMargin = threshold', async () => {
    const made = stubObserver()
    const onLoadMore = vi.fn()
    const { rerender } = render(InfiniteScroll, { props: { onLoadMore, hasMore: true, threshold: 300 } })
    expect(made[0].options).toEqual({ rootMargin: '300px' })
    intersect(made[made.length - 1])
    intersect(made[made.length - 1])
    expect(onLoadMore).toHaveBeenCalledOnce()
    await rerender({ onLoadMore, hasMore: true, threshold: 300, loading: true })
    flushSync()
    await rerender({ onLoadMore, hasMore: true, threshold: 300, loading: false })
    flushSync()
    intersect(made[made.length - 1])
    expect(onLoadMore).toHaveBeenCalledTimes(2)
  })

  it('stops observing when there is nothing more', async () => {
    const made = stubObserver()
    const onLoadMore = vi.fn()
    const { container, rerender } = render(InfiniteScroll, { props: { onLoadMore, hasMore: true } })
    await rerender({ onLoadMore, hasMore: false, endMessage: 'Done' })
    flushSync()
    expect(made[0].disconnect).toHaveBeenCalled()
    expect(container.querySelector('.ui-infinite-scroll__sentinel')).toBeNull()
    expect(container.querySelector('.ui-infinite-scroll__end')!.textContent).toBe('Done')
  })
})

describe('Affix', () => {
  it('renders in place by default and in <body> withinPortal, removed on destroy', () => {
    const inline = render(Affix, { props: {} })
    expect(inline.container.querySelector('.ui-affix')).not.toBeNull()
    const { container, unmount } = render(Affix, { props: { withinPortal: true, id: 'portaled' } })
    const el = document.getElementById('portaled')!
    expect(el.parentElement).toBe(document.body)
    expect(container.contains(el)).toBe(false)
    expect(el.style.bottom).toBe('20px')
    unmount()
    expect(document.getElementById('portaled')).toBeNull()
  })
})
