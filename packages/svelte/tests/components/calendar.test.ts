import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import Calendar from '../../src/components/Calendar.svelte'
import Probe from './calendar-bind-probe.svelte'
import { CONTRACT_NOW } from '../contract/cases.js'

// today = 2026-01-15 (TZ=UTC)
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(CONTRACT_NOW) })
afterEach(() => { vi.useRealTimers() })

const day = (c: HTMLElement, y: number, m: number, d: number) =>
  c.querySelector(`[data-day-key="${y}-${m}-${d}"]:not([data-outside])`) as HTMLButtonElement
const title = (c: HTMLElement) => c.querySelector('.ui-calendar__grid')!.getAttribute('aria-label')
const key = (el: Element, k: string, init: KeyboardEventInit = {}) => {
  const e = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init })
  el.dispatchEvent(e)
  flushSync()
  return e
}

describe('Calendar', () => {
  it('uncontrolled: a click selects the day and reports it', async () => {
    const onChange = vi.fn()
    const { container } = render(Calendar, { props: { onChange } })
    expect(day(container, 2026, 0, 15).tabIndex).toBe(0)
    await fireEvent.click(day(container, 2026, 0, 20))
    expect(onChange).toHaveBeenCalledOnce()
    expect((onChange.mock.calls[0][0] as Date).getDate()).toBe(20)
    expect(day(container, 2026, 0, 20).hasAttribute('data-selected')).toBe(true)
    expect(day(container, 2026, 0, 20).tabIndex).toBe(0)
    expect(day(container, 2026, 0, 15).tabIndex).toBe(-1)
  })

  it('bind:value is two-way', async () => {
    const { container } = render(Probe)
    const out = container.querySelector('output')!
    expect(out.textContent).toBe('10')
    await fireEvent.click(day(container, 2026, 0, 12))
    expect(out.textContent).toBe('12')
    expect(out.dataset.calls).toBe('1')
    expect(day(container, 2026, 0, 12).hasAttribute('data-selected')).toBe(true)
  })

  it('ignores disabled days, and _onDayClick intercepts selection', async () => {
    const onChange = vi.fn()
    const { container } = render(Calendar, { props: { onChange, minDate: new Date(2026, 0, 10) } })
    await fireEvent.click(day(container, 2026, 0, 5))
    expect(onChange).not.toHaveBeenCalled()

    const _onDayClick = vi.fn()
    const b = render(Calendar, { props: { onChange, _onDayClick } })
    await fireEvent.click(day(b.container, 2026, 0, 20))
    expect(_onDayClick).toHaveBeenCalledOnce()
    expect(onChange).not.toHaveBeenCalled()
    expect(day(b.container, 2026, 0, 20).hasAttribute('data-selected')).toBe(false)
  })

  it('navigates months across year boundaries', async () => {
    const { container, getByLabelText } = render(Calendar)
    await fireEvent.click(getByLabelText('Previous month'))
    expect(title(container)).toBe('December 2025')
    await fireEvent.click(getByLabelText('Next month'))
    await fireEvent.click(getByLabelText('Next month'))
    expect(title(container)).toBe('February 2026')
  })

  it('month and year pickers jump the view and close', async () => {
    const { container, getAllByLabelText, getByRole } = render(Calendar)
    await fireEvent.click(getAllByLabelText('Select month')[0])
    await fireEvent.click(getByRole('option', { name: 'Jun' }))
    expect(title(container)).toBe('June 2026')
    expect(container.querySelector('[role="listbox"]')).toBeNull()
    await fireEvent.click(getAllByLabelText('Select year')[0])
    expect(getByRole('option', { name: '2026' }).getAttribute('aria-selected')).toBe('true')
    await fireEvent.click(getByRole('option', { name: '2021' }))
    expect(title(container)).toBe('June 2021')
    await fireEvent.click(getAllByLabelText('Select year')[0])
    key(container.querySelector('.ui-calendar__grid')!, 'Escape')
    expect(container.querySelector('[role="listbox"]')).toBeNull()
  })

  it('arrow keys move focus, refuse a disabled target, and cross into the next month', () => {
    const { container } = render(Calendar, { props: { maxDate: new Date(2026, 1, 5) } })
    const active = () => document.activeElement as HTMLElement
    key(container.querySelector('.ui-calendar__grid')!, 'ArrowRight')
    expect(active()).toBe(day(container, 2026, 0, 16))
    key(active(), 'ArrowDown')
    key(active(), 'ArrowDown')
    expect(active()).toBe(day(container, 2026, 0, 30))
    // Feb 6 is after maxDate: focus and view stay.
    key(active(), 'ArrowDown')
    expect(active()).toBe(day(container, 2026, 0, 30))
    expect(title(container)).toBe('January 2026')
    key(active(), 'ArrowRight')
    key(active(), 'ArrowRight')
    expect(title(container)).toBe('February 2026')
    expect(active()).toBe(day(container, 2026, 1, 1))
    expect(active().tabIndex).toBe(0)
  })

  it('PageDown / Shift+PageUp move a month / a year; Enter selects the focused day', async () => {
    const onChange = vi.fn()
    const { container } = render(Calendar, { props: { onChange } })
    const grid = container.querySelector('.ui-calendar__grid')!
    expect(key(grid, 'PageDown').defaultPrevented).toBe(true)
    expect(title(container)).toBe('February 2026')
    key(container.querySelector('.ui-calendar__grid')!, 'PageUp', { shiftKey: true })
    expect(title(container)).toBe('February 2025')
    key(container.querySelector('.ui-calendar__grid')!, 'Enter')
    expect((onChange.mock.calls[0][0] as Date).toDateString()).toBe(new Date(2025, 1, 15).toDateString())
  })

  it('Enter without a focused day does nothing', () => {
    const onChange = vi.fn()
    const { container } = render(Calendar, { props: { onChange } })
    key(container.querySelector('.ui-calendar__grid')!, 'Enter')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('reports day hover for range pickers', async () => {
    const _onDayHover = vi.fn()
    const { container } = render(Calendar, { props: { _onDayHover } })
    await fireEvent.mouseEnter(day(container, 2026, 0, 3))
    expect((_onDayHover.mock.calls[0][0] as Date).getDate()).toBe(3)
    await fireEvent.mouseLeave(day(container, 2026, 0, 3))
    expect(_onDayHover).toHaveBeenLastCalledWith(null)
  })
})
