import { describe, it, expect, vi, afterEach } from 'vitest'
import { render } from '@testing-library/svelte'
import { createRawSnippet, flushSync } from 'svelte'
import Button from '../../src/components/Button.svelte'

const children = createRawSnippet(() => ({ render: () => '<b>Save</b>' }))

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  delete (navigator as { vibrate?: unknown }).vibrate
})

function key(init: KeyboardEventInit) {
  const e = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init })
  document.dispatchEvent(e)
  return e
}

describe('Button', () => {
  it('passes the click event to onclick', () => {
    const onclick = vi.fn()
    const { container } = render(Button, { props: { onclick, children } })
    container.querySelector('button')!.click()
    expect(onclick).toHaveBeenCalledOnce()
    expect(onclick.mock.calls[0][0]).toBeInstanceOf(MouseEvent)
  })

  it('debounces clicks closer than 150ms, as React does', () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(1_000_000)
    const onclick = vi.fn()
    const { container } = render(Button, { props: { onclick, children } })
    const btn = container.querySelector('button')!
    btn.click()
    vi.setSystemTime(1_000_149)
    btn.click()
    expect(onclick).toHaveBeenCalledTimes(1)
    vi.setSystemTime(1_000_300)
    btn.click()
    expect(onclick).toHaveBeenCalledTimes(2)
  })

  it('swallows clicks while loading', () => {
    const onclick = vi.fn()
    const { container } = render(Button, { props: { onclick, loading: true, children } })
    container.querySelector('button')!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(onclick).not.toHaveBeenCalled()
  })

  it('vibrates with the light pattern for haptics=true and the named one otherwise', () => {
    const vibrate = vi.fn(() => true)
    ;(navigator as { vibrate?: unknown }).vibrate = vibrate
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(1_000_000)
    const a = render(Button, { props: { haptics: true, children } })
    a.container.querySelector('button')!.click()
    expect(vibrate).toHaveBeenLastCalledWith([5])
    const b = render(Button, { props: { haptics: 'error', children } })
    b.container.querySelector('button')!.click()
    expect(vibrate).toHaveBeenLastCalledWith([20, 40, 20, 40, 20])
    const c = render(Button, { props: { children } })
    c.container.querySelector('button')!.click()
    expect(vibrate).toHaveBeenCalledTimes(2)
  })

  it('clicks itself on its shortcut and only with every modifier held', () => {
    const onclick = vi.fn()
    render(Button, { props: { onclick, shortcuts: { activate: 'Ctrl+Shift+S' }, children } })
    expect(key({ key: 's', ctrlKey: true }).defaultPrevented).toBe(false)
    expect(onclick).not.toHaveBeenCalled()
    expect(key({ key: 'S', ctrlKey: true, shiftKey: true }).defaultPrevented).toBe(true)
    expect(onclick).toHaveBeenCalledOnce()
  })

  it('follows a changed shortcut and removes the listener on unmount', async () => {
    const onclick = vi.fn()
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(1_000_000)
    const { rerender, unmount } = render(Button, { props: { onclick, shortcuts: { activate: 'k' }, children } })
    await rerender({ onclick, shortcuts: { activate: 'j' }, children })
    flushSync()
    key({ key: 'k' })
    expect(onclick).not.toHaveBeenCalled()
    key({ key: 'j' })
    expect(onclick).toHaveBeenCalledOnce()
    unmount()
    vi.setSystemTime(1_001_000)
    key({ key: 'j' })
    expect(onclick).toHaveBeenCalledOnce()
  })
})
