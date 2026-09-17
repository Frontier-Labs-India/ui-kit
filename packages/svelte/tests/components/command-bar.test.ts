import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import CommandBar from '../../src/components/CommandBar.svelte'

afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })

const make = () => [
  { id: 'new', label: 'New file', section: 'File', onSelect: vi.fn() },
  { id: 'open', label: 'Open', section: 'File', disabled: true, onSelect: vi.fn() },
  { id: 'theme', label: 'Toggle theme', keywords: ['dark mode'], section: 'View', onSelect: vi.fn() },
]
const labels = (c: HTMLElement) => Array.from(c.querySelectorAll('.ui-command-bar__item-label')).map(l => l.textContent)
const key = (el: Element, k: string) => { const e = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }); el.dispatchEvent(e); flushSync(); return e }

describe('CommandBar', () => {
  it('opens through showModal on the same dialog node, focuses the input, and resets when closed', async () => {
    vi.useFakeTimers()
    const show = vi.spyOn(HTMLDialogElement.prototype, 'showModal')
    const items = make()
    const { container, rerender } = render(CommandBar, { props: { items, open: false, onOpenChange: vi.fn() } })
    const dialog = container.querySelector('dialog')!
    await rerender({ items, open: true, onOpenChange: vi.fn() })
    flushSync()
    expect(container.querySelector('dialog')).toBe(dialog)
    expect(show).toHaveBeenCalledOnce()
    vi.runAllTimers()
    const input = container.querySelector('input')!
    expect(document.activeElement).toBe(input)
    input.value = 'thm'
    await fireEvent.input(input)
    expect(labels(container)).toEqual(['Toggle theme'])
    await rerender({ items, open: false, onOpenChange: vi.fn() })
    flushSync()
    expect(dialog.hasAttribute('open')).toBe(false)
    await rerender({ items, open: true, onOpenChange: vi.fn() })
    flushSync()
    expect(container.querySelector('input')!.value).toBe('')
  })

  it('keyboard skips disabled items; Enter selects, closes and records Recent; Escape closes', async () => {
    const items = make()
    const onOpenChange = vi.fn()
    const { container, rerender } = render(CommandBar, { props: { items, open: true, onOpenChange } })
    const dialog = container.querySelector('dialog')!
    key(dialog, 'ArrowDown') // from New file to Toggle theme (Open is disabled)
    expect(container.querySelector('input')!.getAttribute('aria-activedescendant')).toBe(container.querySelector('[data-active]')!.id)
    expect(container.querySelector('[data-active] .ui-command-bar__item-label')!.textContent).toBe('Toggle theme')
    key(dialog, 'Enter')
    expect(items[2].onSelect).toHaveBeenCalledOnce()
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
    await rerender({ items, open: false, onOpenChange })
    flushSync()
    await rerender({ items, open: true, onOpenChange })
    flushSync()
    expect(container.querySelector('.ui-command-bar__section-header')!.textContent).toBe('Recent')
    expect(labels(container)[0]).toBe('Toggle theme')
    key(container.querySelector('dialog')!, 'Escape')
    expect(onOpenChange).toHaveBeenCalledTimes(2)
  })

  it('toggles with Meta/Ctrl+K by default or a custom shortcut, against the current open state', async () => {
    const onOpenChange = vi.fn()
    const { rerender } = render(CommandBar, { props: { items: [], open: false, onOpenChange } })
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, cancelable: true }))
    expect(onOpenChange).toHaveBeenLastCalledWith(true)
    await rerender({ items: [], open: true, onOpenChange, shortcut: ['alt', 'p'] })
    flushSync()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, cancelable: true }))
    expect(onOpenChange).toHaveBeenCalledOnce()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'p', altKey: true, cancelable: true }))
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
  })

  it('a click on the backdrop closes; a click inside does not; clicking a disabled item does nothing', async () => {
    const items = make()
    const onOpenChange = vi.fn()
    const { container } = render(CommandBar, { props: { items, open: true, onOpenChange } })
    await fireEvent.click(container.querySelector('.ui-command-bar__list')!)
    const disabled = Array.from(container.querySelectorAll('[role="option"]')).find(o => o.textContent?.includes('Open'))!
    await fireEvent.click(disabled)
    expect(items[1].onSelect).not.toHaveBeenCalled()
    expect(onOpenChange).not.toHaveBeenCalled()
    await fireEvent.click(container.querySelector('dialog')!)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
