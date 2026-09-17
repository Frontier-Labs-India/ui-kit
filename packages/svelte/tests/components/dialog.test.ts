import { describe, it, expect, vi, afterEach } from 'vitest'
import { render } from '@testing-library/svelte'
import { createRawSnippet, flushSync } from 'svelte'
import Dialog from '../../src/components/Dialog.svelte'
import ConfirmDialog from '../../src/components/ConfirmDialog.svelte'

const children = createRawSnippet(() => ({ render: () => '<b>Body</b>' }))

afterEach(() => vi.restoreAllMocks())

function esc(el: Element) {
  const e = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
  el.dispatchEvent(e)
  return e
}

describe('Dialog', () => {
  it('opens through showModal and closes through close as the prop changes', async () => {
    const show = vi.spyOn(HTMLDialogElement.prototype, 'showModal')
    const close = vi.spyOn(HTMLDialogElement.prototype, 'close')
    const onClose = vi.fn()
    const { container, rerender } = render(Dialog, { props: { open: false, onClose, children } })
    const dialog = container.querySelector('dialog')!
    expect(show).not.toHaveBeenCalled()
    await rerender({ open: true, onClose, children })
    flushSync()
    expect(show).toHaveBeenCalledOnce()
    expect(dialog.hasAttribute('open')).toBe(true)
    await rerender({ open: false, onClose, children })
    flushSync()
    expect(close).toHaveBeenCalledOnce()
    expect(dialog.hasAttribute('open')).toBe(false)
  })

  it('mounting open calls showModal once', () => {
    const show = vi.spyOn(HTMLDialogElement.prototype, 'showModal')
    render(Dialog, { props: { open: true, onClose: vi.fn(), children } })
    expect(show).toHaveBeenCalledOnce()
  })

  it('Escape always prevents the native close and calls onClose unless disabled', () => {
    const onClose = vi.fn()
    const a = render(Dialog, { props: { open: true, onClose, children } })
    expect(esc(a.container.querySelector('dialog')!).defaultPrevented).toBe(true)
    expect(onClose).toHaveBeenCalledOnce()

    const off = vi.fn()
    const b = render(Dialog, { props: { open: true, onClose: off, closeOnEscape: false, children } })
    expect(esc(b.container.querySelector('dialog')!).defaultPrevented).toBe(true)
    const c = render(Dialog, { props: { open: true, onClose: off, preventClose: true, children } })
    expect(esc(c.container.querySelector('dialog')!).defaultPrevented).toBe(true)
    expect(off).not.toHaveBeenCalled()
  })

  it('a click on the dialog itself (backdrop) closes; a click inside does not', () => {
    const onClose = vi.fn()
    const { container } = render(Dialog, { props: { open: true, onClose, children } })
    container.querySelector('.ui-dialog__body b')!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(onClose).not.toHaveBeenCalled()
    container.querySelector('dialog')!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('closeOnOverlay=false and preventClose ignore backdrop clicks', () => {
    const onClose = vi.fn()
    for (const extra of [{ closeOnOverlay: false }, { preventClose: true }]) {
      const { container } = render(Dialog, { props: { open: true, onClose, children, ...extra } })
      container.querySelector('dialog')!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    }
    expect(onClose).not.toHaveBeenCalled()
  })

  it('the close button calls onClose even with preventClose, as in React', () => {
    const onClose = vi.fn()
    const { getByRole } = render(Dialog, { props: { open: true, onClose, preventClose: true, children } })
    getByRole('button', { name: 'Close', hidden: true }).click()
    expect(onClose).toHaveBeenCalledOnce()
  })
})

describe('ConfirmDialog', () => {
  it('wires cancel, confirm and Escape to the callbacks', () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(1_000_000)
    try {
      const onConfirm = vi.fn()
      const onCancel = vi.fn()
      const { container, getByText } = render(ConfirmDialog, { props: { open: true, onConfirm, onCancel, title: 'Sure?' } })
      getByText('Confirm').click()
      expect(onConfirm).toHaveBeenCalledOnce()
      getByText('Cancel').click()
      expect(onCancel).toHaveBeenCalledOnce()
      esc(container.querySelector('dialog')!)
      expect(onCancel).toHaveBeenCalledTimes(2)
      // showClose is off: no close button.
      expect(container.querySelector('.ui-dialog__close')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('loading disables both buttons and swallows clicks', () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    const { container } = render(ConfirmDialog, { props: { open: true, onConfirm, onCancel, title: 'Sure?', loading: true } })
    const buttons = Array.from(container.querySelectorAll('.ui-confirm-dialog__actions button')) as HTMLButtonElement[]
    expect(buttons.map(b => b.disabled)).toEqual([true, true])
    for (const b of buttons) b.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(onConfirm).not.toHaveBeenCalled()
    expect(onCancel).not.toHaveBeenCalled()
  })
})
