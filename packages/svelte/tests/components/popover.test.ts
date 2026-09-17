import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import { axe } from 'jest-axe'
import Probe from './popover-probe.svelte'

afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = '' })

const trigger = (c: HTMLElement) => c.querySelector<HTMLButtonElement>('#trigger')!
const panel = () => document.querySelector<HTMLElement>('.ui-popover')

describe('Popover', () => {
  it('toggles from its trigger, reporting each change, and keeps the caller\'s click handler', async () => {
    const onOpenChange = vi.fn()
    const { container, component } = render(Probe, { props: { onOpenChange } })
    const t = trigger(container)
    expect(t.getAttribute('aria-expanded')).toBe('false')
    expect(t.hasAttribute('aria-controls')).toBe(false)
    await fireEvent.click(t)
    expect(onOpenChange).toHaveBeenLastCalledWith(true)
    expect(t.getAttribute('aria-expanded')).toBe('true')
    expect(t.getAttribute('aria-controls')).toBe(panel()!.querySelector('[role="dialog"]')!.id)
    await fireEvent.click(t)
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
    expect(panel()).toBeNull()
    expect(component.getClicks()).toBe(2)
  })

  it('closes on Escape and on mousedown outside, not on mousedown inside the panel or on the trigger', async () => {
    const { container } = render(Probe, {})
    await fireEvent.click(trigger(container))
    await fireEvent.mouseDown(panel()!.querySelector('.ui-popover__panel')!)
    await fireEvent.mouseDown(trigger(container))
    expect(panel()).not.toBeNull()
    await fireEvent.keyDown(document, { key: 'Escape' })
    expect(panel()).toBeNull()
    await fireEvent.click(trigger(container))
    await fireEvent.mouseDown(container.querySelector('#outside')!)
    expect(panel()).toBeNull()
  })

  it('controlled: open follows the prop, clicks only report', async () => {
    const onOpenChange = vi.fn()
    const { container, rerender } = render(Probe, { props: { open: false, onOpenChange } })
    await fireEvent.click(trigger(container))
    expect(onOpenChange).toHaveBeenCalledWith(true)
    expect(panel()).toBeNull()
    await rerender({ open: true, onOpenChange })
    expect(panel()).not.toBeNull()
  })

  it('controlled clicks leave the uncontrolled state alone, so dropping `open` restores it (as React)', async () => {
    const { container, rerender } = render(Probe, { props: { open: false } })
    await fireEvent.click(trigger(container))
    await rerender({ open: undefined })
    expect(panel()).toBeNull()
  })

  it('places the panel beside the measured trigger', async () => {
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      if (this.id === 'trigger') return { top: 300, bottom: 330, left: 100, right: 180, width: 80, height: 30, x: 100, y: 300 } as DOMRect
      return { top: 0, bottom: 50, left: 0, right: 120, width: 120, height: 50, x: 0, y: 0 } as DOMRect
    })
    const { container } = render(Probe, { props: { placement: 'bottom' } })
    await fireEvent.click(trigger(container))
    flushSync()
    const p = panel()!
    expect(p.dataset.placement).toBe('bottom')
    expect(p.style.top).toBe('338px')
    expect(p.style.left).toBe('80px')
  })

  it('flips to the other side when the requested one has no room', async () => {
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      if (this.id === 'trigger') return { top: 10, bottom: 40, left: 100, right: 180, width: 80, height: 30, x: 100, y: 10 } as DOMRect
      return { top: 0, bottom: 50, left: 0, right: 120, width: 120, height: 50, x: 0, y: 0 } as DOMRect
    })
    const { container } = render(Probe, { props: { placement: 'top' } })
    await fireEvent.click(trigger(container))
    flushSync()
    expect(panel()!.dataset.placement).toBe('bottom')
    expect(panel()!.style.top).toBe('48px')
  })

  it('binds ref to the trigger, and is accessible on a real button', async () => {
    const { container, component } = render(Probe, {})
    expect(component.getRef()).toBe(trigger(container))
    await fireEvent.click(trigger(container))
    expect((await axe(document.body)).violations).toEqual([])
  })

  it('modal: focus moves into the panel and returns to the trigger on close', async () => {
    const { container } = render(Probe, { props: { modal: true } })
    const t = trigger(container)
    t.focus()
    await fireEvent.click(t)
    flushSync()
    expect(document.activeElement).toBe(document.querySelector('#inner'))
    await fireEvent.keyDown(document, { key: 'Escape' })
    flushSync()
    expect(document.activeElement).toBe(t)
  })
})
