import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/svelte'
import Probe from './tabs-probe.svelte'

const TABS = [
  { id: 'a', label: 'A' },
  { id: 'b', label: 'B', disabled: true },
  { id: 'c', label: 'C', closeable: true },
]
const tabEls = (c: HTMLElement) => [...c.querySelectorAll<HTMLElement>('[role="tab"]')]
const visiblePanel = (c: HTMLElement) => [...c.querySelectorAll<HTMLElement>('[role="tabpanel"]')].find(p => !p.hidden)

describe('Tabs (array API with TabPanel parts)', () => {
  it('selects on click, reporting it, and ignores a disabled tab', async () => {
    const onChange = vi.fn()
    const { container } = render(Probe, { props: { tabs: TABS, onChange } })
    expect(visiblePanel(container)!.textContent).toBe('Panel A')
    await fireEvent.click(tabEls(container)[1])
    expect(onChange).not.toHaveBeenCalled()
    await fireEvent.click(tabEls(container)[2])
    expect(onChange).toHaveBeenCalledWith('c')
    expect(visiblePanel(container)!.textContent).toBe('Panel C')
    expect(tabEls(container)[2].getAttribute('aria-selected')).toBe('true')
  })

  it('the close button reports onClose without selecting the tab', async () => {
    const onChange = vi.fn(), onClose = vi.fn()
    const { container } = render(Probe, { props: { tabs: TABS, onChange, onClose } })
    await fireEvent.click(container.querySelector('.ui-tabs__tab-close')!)
    expect(onClose).toHaveBeenCalledWith('c')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('arrow keys skip disabled tabs and wrap, Home/End jump, Enter selects, with roving tabindex', async () => {
    const onChange = vi.fn()
    const { container } = render(Probe, { props: { tabs: TABS, onChange } })
    const list = container.querySelector('[role="tablist"]')!
    const [a, , c] = tabEls(container)
    a.focus()
    await fireEvent.keyDown(list, { key: 'ArrowRight' })
    expect(document.activeElement).toBe(c)
    expect(c.getAttribute('tabindex')).toBe('0')
    expect(a.getAttribute('tabindex')).toBe('-1')
    await fireEvent.keyDown(list, { key: 'ArrowRight' })
    expect(document.activeElement).toBe(a)
    await fireEvent.keyDown(list, { key: 'End' })
    expect(document.activeElement).toBe(c)
    await fireEvent.keyDown(list, { key: 'Enter' })
    expect(onChange).toHaveBeenCalledWith('c')
    await fireEvent.keyDown(list, { key: 'Home' })
    expect(document.activeElement).toBe(a)
    await fireEvent.keyDown(list, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(a)
  })

  it('vertical orientation navigates with ArrowDown', async () => {
    const { container } = render(Probe, { props: { tabs: TABS, orientation: 'vertical' } })
    tabEls(container)[0].focus()
    await fireEvent.keyDown(container.querySelector('[role="tablist"]')!, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(tabEls(container)[2])
  })

  it('controlled: the active tab follows the prop only', async () => {
    const { container, rerender } = render(Probe, { props: { tabs: TABS, activeTab: 'a' } })
    await fireEvent.click(tabEls(container)[2])
    expect(visiblePanel(container)!.textContent).toBe('Panel A')
    await rerender({ tabs: TABS, activeTab: 'c' })
    expect(visiblePanel(container)!.textContent).toBe('Panel C')
  })

  it('controlled clicks leave the uncontrolled state alone, so dropping activeTab restores it (as React)', async () => {
    const { container, rerender } = render(Probe, { props: { tabs: TABS, activeTab: 'a' } })
    await fireEvent.click(tabEls(container)[2])
    await rerender({ tabs: TABS, activeTab: undefined })
    expect(visiblePanel(container)!.textContent).toBe('Panel A')
  })

  it('lazy renders only the active panel', () => {
    const { container } = render(Probe, { props: { tabs: TABS, lazy: true } })
    expect(container.querySelectorAll('[role="tabpanel"]')).toHaveLength(1)
  })

  it('panels follow TabPanel parts appearing and disappearing', async () => {
    const tabs = [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }]
    const { container, rerender } = render(Probe, { props: { tabs, activeTab: 'b' } })
    expect(visiblePanel(container)!.textContent).toBe('Panel B')
    await rerender({ tabs, activeTab: 'b', showB: false })
    expect(visiblePanel(container)!.textContent).toBe('')
    await rerender({ tabs, activeTab: 'b', showB: true })
    expect(visiblePanel(container)!.textContent).toBe('Panel B')
  })
})

describe('Tabs (composed API)', () => {
  it('a trigger selects its content; a disabled one does not', async () => {
    const onChange = vi.fn()
    const { container } = render(Probe, { props: { composed: true, onChange } })
    const panels = () => [...container.querySelectorAll<HTMLElement>('[role="tabpanel"]')].map(p => p.hidden)
    expect(panels()).toEqual([false, true])
    await fireEvent.click(tabEls(container)[1])
    expect(onChange).not.toHaveBeenCalled()
    await fireEvent.click(tabEls(container)[2])
    expect(onChange).toHaveBeenCalledWith('three')
    expect(panels()).toEqual([true, false])
    expect(tabEls(container)[2].getAttribute('aria-controls')).toBe(container.querySelectorAll('[role="tabpanel"]')[1].id)
  })

  it('TabList moves focus over enabled triggers and Enter activates', async () => {
    const onChange = vi.fn()
    const { container } = render(Probe, { props: { composed: true, onChange } })
    const list = container.querySelector('[role="tablist"]')!
    tabEls(container)[0].focus()
    await fireEvent.keyDown(list, { key: 'ArrowRight' })
    expect(document.activeElement).toBe(tabEls(container)[2])
    await fireEvent.keyDown(list, { key: 'Enter' })
    expect(onChange).toHaveBeenCalledWith('three')
    await fireEvent.keyDown(list, { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(tabEls(container)[0])
  })
})
