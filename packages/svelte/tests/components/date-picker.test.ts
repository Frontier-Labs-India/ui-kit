import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import DatePicker from '../../src/components/DatePicker.svelte'
import BindProbe from './value-bind-probe.svelte'

afterEach(() => { vi.restoreAllMocks() })

const input = (c: HTMLElement) => c.querySelector<HTMLInputElement>('.ui-date-picker__input')!
const monthLabel = (c: HTMLElement) => c.querySelector('.ui-date-picker__month-label')!.textContent
const day = (c: HTMLElement, d: number) => c.querySelector<HTMLButtonElement>(`[data-day="${d}"]`)!
const keyOn = (el: Element, k: string) => {
  const e = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true })
  el.dispatchEvent(e)
  flushSync()
  return e
}

describe('DatePicker', () => {
  it('opens from the input, shows the value month, selects an ISO date and closes (bind:value)', async () => {
    const { container } = render(BindProbe, { props: { field: DatePicker, initial: '2026-03-09', props: { 'aria-label': 'D' } } })
    expect(input(container).value).toBe('Mar 9, 2026')
    await fireEvent.click(input(container))
    expect(input(container).getAttribute('aria-expanded')).toBe('true')
    expect(monthLabel(container)).toBe('March 2026')
    expect(day(container, 9).hasAttribute('data-selected')).toBe(true)
    expect(day(container, 9).tabIndex).toBe(0)
    await fireEvent.click(day(container, 20))
    expect(container.querySelector('output')!.textContent).toBe('"2026-03-20"')
    expect(container.querySelector('[role="dialog"]')).toBeNull()
    expect(input(container).value).toBe('Mar 20, 2026')
  })

  it('min, max and outside days are disabled and cannot be picked', async () => {
    const onChange = vi.fn()
    const { container } = render(DatePicker, { props: { 'aria-label': 'D', defaultValue: '2026-03-15', min: '2026-03-10', max: '2026-03-20', onChange } })
    await fireEvent.click(container.querySelector('.ui-date-picker__trigger')!)
    expect(day(container, 9).disabled).toBe(true)
    expect(day(container, 21).disabled).toBe(true)
    expect(container.querySelector<HTMLButtonElement>('[data-outside]')!.disabled).toBe(true)
    await fireEvent.click(day(container, 9))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('arrow keys move focus within the month and across it on the next frame; Enter selects; Escape closes', async () => {
    const frames: FrameRequestCallback[] = []
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(f => { frames.push(f); return frames.length })
    const onChange = vi.fn()
    const { container } = render(DatePicker, { props: { 'aria-label': 'D', defaultValue: '2026-03-02', onChange } })
    await fireEvent.click(input(container))
    day(container, 2).focus()
    keyOn(document.activeElement!, 'ArrowDown')
    expect(document.activeElement).toBe(day(container, 9))
    keyOn(document.activeElement!, 'ArrowUp')
    keyOn(document.activeElement!, 'ArrowLeft')
    expect(document.activeElement).toBe(day(container, 1))
    keyOn(document.activeElement!, 'ArrowUp') // 1 - 7 → Feb 22
    expect(monthLabel(container)).toBe('February 2026')
    frames.shift()!(0)
    expect(document.activeElement).toBe(day(container, 22))
    keyOn(document.activeElement!, 'Enter')
    expect(onChange).toHaveBeenCalledWith('2026-02-22')
    await fireEvent.click(input(container))
    keyOn(container.querySelector('[role="dialog"]')!, 'Escape')
    expect(container.querySelector('[role="dialog"]')).toBeNull()
  })

  it('month navigation wraps years; the view follows a changed value', async () => {
    const { container, rerender } = render(DatePicker, { props: { 'aria-label': 'D', value: '2026-01-05' } })
    await fireEvent.click(input(container))
    await fireEvent.click(container.querySelector('[aria-label="Previous month"]')!)
    expect(monthLabel(container)).toBe('December 2025')
    await rerender({ 'aria-label': 'D', value: '2026-07-01' })
    flushSync()
    expect(monthLabel(container)).toBe('July 2026')
  })

  it('closes on a mousedown outside the picker, not inside it', async () => {
    const { container } = render(DatePicker, { props: { 'aria-label': 'D' } })
    await fireEvent.click(input(container))
    input(container).dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    flushSync()
    expect(container.querySelector('[role="dialog"]')).not.toBeNull()
    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    flushSync()
    expect(container.querySelector('[role="dialog"]')).toBeNull()
  })

  it('disabled does not open', async () => {
    const { container } = render(DatePicker, { props: { 'aria-label': 'D', disabled: true } })
    await fireEvent.click(input(container))
    expect(container.querySelector('[role="dialog"]')).toBeNull()
  })
})
