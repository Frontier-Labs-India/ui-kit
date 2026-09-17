import { describe, it, expect, vi, afterEach } from 'vitest'
import { render } from '@testing-library/svelte'
import { createRawSnippet } from 'svelte'
import ViewTransitionLink from '../../src/components/ViewTransitionLink.svelte'

const children = createRawSnippet(() => ({ render: () => '<b>Go</b>' }))

afterEach(() => {
  delete (document as { startViewTransition?: unknown }).startViewTransition
  vi.restoreAllMocks()
})

function click(a: Element) {
  const e = new MouseEvent('click', { bubbles: true, cancelable: true })
  a.dispatchEvent(e)
  return e
}

describe('ViewTransitionLink', () => {
  it('falls through to native navigation when the API is absent', () => {
    const { container } = render(ViewTransitionLink, { props: { href: '#next', children } })
    const e = click(container.querySelector('a')!)
    expect(e.defaultPrevented).toBe(false)
  })

  it('prevents default and starts a view transition when the API exists', () => {
    const start = vi.fn()
    ;(document as { startViewTransition?: unknown }).startViewTransition = start
    const { container } = render(ViewTransitionLink, { props: { href: '#next', children } })
    const e = click(container.querySelector('a')!)
    expect(e.defaultPrevented).toBe(true)
    expect(start).toHaveBeenCalledOnce()
  })

  it("calls the caller's onclick first, with the event", () => {
    const onclick = vi.fn()
    const { container } = render(ViewTransitionLink, { props: { href: '#next', onclick, children } })
    click(container.querySelector('a')!)
    expect(onclick).toHaveBeenCalledOnce()
    expect(onclick.mock.calls[0][0]).toBeInstanceOf(MouseEvent)
  })

  it('does not start a transition when the caller prevented default', () => {
    const start = vi.fn()
    ;(document as { startViewTransition?: unknown }).startViewTransition = start
    const onclick = (e: MouseEvent) => e.preventDefault()
    const { container } = render(ViewTransitionLink, { props: { href: '#next', onclick, children } })
    click(container.querySelector('a')!)
    expect(start).not.toHaveBeenCalled()
  })
})
