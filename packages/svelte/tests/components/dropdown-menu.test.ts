import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import { axe } from 'jest-axe'
import Probe from './dropdown-menu-probe.svelte'

afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = '' })

const trigger = () => document.querySelector<HTMLButtonElement>('#trigger')!
const menu = () => document.querySelector<HTMLElement>('[role="menu"]')
const items = () => [...document.querySelectorAll<HTMLElement>('[role="menuitem"]')]

function itemsProps(onPick: (n: string) => void) {
  return [
    { label: 'One', onClick: () => onPick('one') },
    { type: 'separator' as const },
    { label: 'Two', disabled: true, onClick: () => onPick('two') },
    { label: 'Three', onClick: () => onPick('three') },
  ]
}

for (const composed of [false, true]) {
  describe(`DropdownMenu (${composed ? 'composed parts' : 'items'})`, () => {
    const setup = (extra: Record<string, unknown> = {}) => {
      const onPick = vi.fn()
      const onOpenChange = vi.fn()
      const r = render(Probe, { props: { composed, items: itemsProps(onPick), onPick, onOpenChange, ...extra } })
      return { ...r, onPick, onOpenChange }
    }

    it('opens from the trigger, wiring aria-expanded and aria-controls, and keeps the caller\'s click', async () => {
      const { onOpenChange, component } = setup()
      expect(trigger().getAttribute('aria-expanded')).toBe('false')
      expect(trigger().getAttribute('aria-haspopup')).toBe('menu')
      await fireEvent.click(trigger())
      expect(onOpenChange).toHaveBeenLastCalledWith(true)
      expect(trigger().getAttribute('aria-controls')).toBe(menu()!.id)
      expect(component.getClicks()).toBe(1)
      expect(component.getRef()).toBe(trigger())
    })

    it('an item click runs its handler and closes; a disabled item does neither', async () => {
      const { onPick } = setup()
      await fireEvent.click(trigger())
      await fireEvent.click(items()[1])
      expect(onPick).not.toHaveBeenCalled()
      expect(menu()).not.toBeNull()
      await fireEvent.click(items()[0])
      expect(onPick).toHaveBeenCalledWith('one')
      expect(menu()).toBeNull()
    })

    it('arrow keys, Home and End skip disabled items and wrap; Enter clicks the focused item', async () => {
      const { onPick } = setup()
      await fireEvent.click(trigger())
      const panel = menu()!
      await fireEvent.keyDown(panel, { key: 'ArrowDown' })
      expect(document.activeElement).toBe(items()[0])
      await fireEvent.keyDown(panel, { key: 'ArrowDown' })
      expect(document.activeElement).toBe(items()[2])
      await fireEvent.keyDown(panel, { key: 'ArrowDown' })
      expect(document.activeElement).toBe(items()[0])
      await fireEvent.keyDown(panel, { key: 'ArrowUp' })
      expect(document.activeElement).toBe(items()[2])
      await fireEvent.keyDown(panel, { key: 'Home' })
      expect(document.activeElement).toBe(items()[0])
      await fireEvent.keyDown(panel, { key: 'End' })
      expect(document.activeElement).toBe(items()[2])
      await fireEvent.keyDown(panel, { key: 'Enter' })
      expect(onPick).toHaveBeenCalledWith('three')
      expect(menu()).toBeNull()
    })

    it('closes on Escape and on mousedown outside, not inside', async () => {
      setup()
      await fireEvent.click(trigger())
      await fireEvent.mouseDown(items()[0])
      await fireEvent.mouseDown(trigger())
      expect(menu()).not.toBeNull()
      await fireEvent.keyDown(document, { key: 'Escape' })
      expect(menu()).toBeNull()
      await fireEvent.click(trigger())
      await fireEvent.mouseDown(document.querySelector('#outside')!)
      expect(menu()).toBeNull()
    })

    it('places the menu above the measured trigger for a top placement', async () => {
      vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
        if (this.id === 'trigger') return { top: 300, bottom: 330, left: 100, right: 180, width: 80, height: 30, x: 100, y: 300 } as DOMRect
        return { top: 0, bottom: 100, left: 0, right: 120, width: 120, height: 100, x: 0, y: 0 } as DOMRect
      })
      setup({ placement: 'top-end' })
      await fireEvent.click(trigger())
      flushSync()
      const root = document.querySelector<HTMLElement>('.ui-dropdown-menu')!
      expect(root.dataset.placement).toBe('top-end')
      expect(root.style.top).toBe('196px')
    })

    it('has no axe violations open, with a real button trigger', async () => {
      setup()
      await fireEvent.click(trigger())
      // `region`: the bare test page has no landmarks, which says nothing about the menu.
      expect((await axe(document.body, { rules: { region: { enabled: false } } })).violations).toEqual([])
    })
  })
}
