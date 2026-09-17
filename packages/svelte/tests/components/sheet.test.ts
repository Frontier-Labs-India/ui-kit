import { describe, it, expect, vi, afterEach } from 'vitest'
import { render } from '@testing-library/svelte'
import { createRawSnippet, flushSync } from 'svelte'
import Sheet from '../../src/components/Sheet.svelte'

const children = createRawSnippet(() => ({ render: () => '<b>Body</b>' }))
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })

// jsdom's PointerEvent support varies; a MouseEvent of the pointer type carries clientX/Y.
const pointer = (el: Element, type: string, x: number, y: number) =>
  el.dispatchEvent(new MouseEvent(type, { clientX: x, clientY: y, bubbles: true }))

function swipe(el: Element, dx: number, dy: number, ms = 100) {
  pointer(el, 'pointerdown', 100, 100)
  vi.advanceTimersByTime(ms)
  pointer(el, 'pointerup', 100 + dx, 100 + dy)
}

describe('Sheet', () => {
  it('opens and closes through the modal API; Escape and backdrop call onClose', async () => {
    const show = vi.spyOn(HTMLDialogElement.prototype, 'showModal')
    const onClose = vi.fn()
    const { container, rerender } = render(Sheet, { props: { open: false, onClose, children } })
    await rerender({ open: true, onClose, children })
    flushSync()
    expect(show).toHaveBeenCalledOnce()
    const dialog = container.querySelector('dialog')!
    const esc = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
    dialog.dispatchEvent(esc)
    expect(esc.defaultPrevented).toBe(true)
    dialog.querySelector('b')!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(onClose).toHaveBeenCalledTimes(1)
    dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('a fast swipe towards its own edge dismisses; other directions and slow drags do not', () => {
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] })
    for (const [side, good, bad] of [
      ['right', [80, 0], [-80, 0]],
      ['left', [-80, 0], [80, 0]],
      ['bottom', [0, 80], [0, -80]],
    ] as const) {
      const onClose = vi.fn()
      const { container, unmount } = render(Sheet, { props: { open: true, onClose, side, children } })
      const handle = container.querySelector('.ui-sheet__swipe')!
      swipe(handle, bad[0], bad[1])
      expect(onClose).not.toHaveBeenCalled()
      swipe(handle, good[0], good[1], 400) // too slow
      expect(onClose).not.toHaveBeenCalled()
      swipe(handle, good[0], good[1])
      expect(onClose).toHaveBeenCalledOnce()
      unmount()
    }
  })

  it('stops listening to the swipe handle when destroyed', () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    const onClose = vi.fn()
    const { container, unmount } = render(Sheet, { props: { open: true, onClose, children } })
    const handle = container.querySelector('.ui-sheet__swipe')!
    unmount()
    swipe(handle, 80, 0)
    expect(onClose).not.toHaveBeenCalled()
  })
})
