import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import Spotlight from '../../src/components/Spotlight.svelte'

afterEach(() => { vi.useRealTimers() })

const make = () => [
  { id: 'home', title: 'Home', group: 'Nav', onClick: vi.fn() },
  { id: 'docs', title: 'Documentation', description: 'Read the docs', group: 'Nav', onClick: vi.fn() },
  { id: 'theme', title: 'Toggle theme', keywords: ['dark mode'], group: 'Settings', onClick: vi.fn() },
]
const titles = (c: HTMLElement) => Array.from(c.querySelectorAll('.ui-spotlight__action-title')).map(e => e.textContent)
const key = (el: EventTarget, k: string) => {
  const e = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true })
  el.dispatchEvent(e)
  flushSync()
  return e
}

describe('Spotlight', () => {
  it('fuzzy-filters by title, description and keywords, and shows the empty message', async () => {
    const actions = make()
    const { container } = render(Spotlight, { props: { open: true, actions } })
    const input = container.querySelector('input')!
    input.value = 'dcs'
    await fireEvent.input(input)
    expect(titles(container)).toEqual(['Documentation'])
    input.value = 'drk'
    await fireEvent.input(input)
    expect(titles(container)).toEqual(['Toggle theme'])
    input.value = 'zzz'
    await fireEvent.input(input)
    expect(container.querySelector('.ui-spotlight__empty')!.textContent).toBe('No results found')
  })

  it('arrow keys move aria-activedescendant; Enter runs the action, closes, and records it as recent', () => {
    const actions = make()
    const onOpenChange = vi.fn()
    const { container, rerender } = render(Spotlight, { props: { open: true, actions, onOpenChange } })
    const input = container.querySelector('input')!
    const overlay = container.querySelector('[role="dialog"]')!
    key(overlay, 'ArrowDown')
    key(overlay, 'ArrowDown')
    key(overlay, 'ArrowDown') // clamps at the last
    expect(input.getAttribute('aria-activedescendant')).toBe(container.querySelectorAll('[role="option"]')[2].id)
    key(overlay, 'Home')
    key(overlay, 'ArrowDown')
    key(overlay, 'Enter')
    expect(actions[1].onClick).toHaveBeenCalledOnce()
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
    rerender({ open: false, actions, onOpenChange })
    flushSync()
    rerender({ open: true, actions, onOpenChange })
    flushSync()
    const sections = Array.from(container.querySelectorAll('.ui-spotlight__section-header')).map(e => e.textContent)
    expect(sections[0]).toBe('Recent')
    expect(titles(container)[0]).toBe('Documentation')
  })

  it('Escape and a click on the overlay close; a click inside does not', async () => {
    const onOpenChange = vi.fn()
    const { container } = render(Spotlight, { props: { open: true, actions: make(), onOpenChange } })
    await fireEvent.click(container.querySelector('.ui-spotlight__dialog')!)
    expect(onOpenChange).not.toHaveBeenCalled()
    await fireEvent.click(container.querySelector('.ui-spotlight__overlay')!)
    expect(onOpenChange).toHaveBeenCalledWith(false)
    key(container.querySelector('.ui-spotlight__overlay')!, 'Escape')
    expect(onOpenChange).toHaveBeenCalledTimes(2)
  })

  it('the global shortcut toggles against the current open state', async () => {
    const onOpenChange = vi.fn()
    const { rerender } = render(Spotlight, { props: { open: false, actions: [], onOpenChange, shortcut: 'ctrl+k' } })
    key(document, 'k')
    expect(onOpenChange).not.toHaveBeenCalled()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'K', ctrlKey: true, cancelable: true }))
    expect(onOpenChange).toHaveBeenLastCalledWith(true)
    await rerender({ open: true, actions: [], onOpenChange, shortcut: 'ctrl+k' })
    flushSync()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, cancelable: true }))
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
  })

  it('focuses the input when opened and resets the query when closed', async () => {
    vi.useFakeTimers()
    const { container, rerender } = render(Spotlight, { props: { open: true, actions: make() } })
    vi.runAllTimers()
    const input = container.querySelector('input')!
    expect(document.activeElement).toBe(input)
    input.value = 'doc'
    await fireEvent.input(input)
    await rerender({ open: false, actions: make() })
    await rerender({ open: true, actions: make() })
    flushSync()
    expect(container.querySelector('input')!.value).toBe('')
  })

  it('traps Tab inside the dialog and returns focus to the opener when closed', async () => {
    const opener = document.createElement('button')
    document.body.append(opener)
    opener.focus()
    const { container, rerender } = render(Spotlight, { props: { open: false, actions: [] } })
    await rerender({ open: true, actions: [] })
    flushSync()
    const input = container.querySelector('input')!
    // The input is the dialog's only focusable, so it is both first and last.
    expect(document.activeElement).toBe(input)
    const e = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    input.dispatchEvent(e)
    expect(e.defaultPrevented).toBe(true)
    await rerender({ open: false, actions: [] })
    flushSync()
    expect(document.activeElement).toBe(opener)
    opener.remove()
  })
})
