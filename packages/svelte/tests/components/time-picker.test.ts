import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import TimePicker from '../../src/components/TimePicker.svelte'
import FormProbe from './form-probe.svelte'
import BindProbe from './value-bind-probe.svelte'

afterEach(() => { vi.useRealTimers(); cleanup() })

const trigger = (c: HTMLElement) => c.querySelector<HTMLButtonElement>('.ui-time-picker__trigger')!
const dropdown = () => document.body.querySelector<HTMLElement>(':scope > .ui-time-picker__dropdown')
const column = (i: number) => dropdown()!.querySelectorAll('.ui-time-picker__column')[i]
const option = (col: number, text: string) =>
  Array.from(column(col).querySelectorAll<HTMLButtonElement>('[role="option"]')).find(b => b.textContent === text)!
const out = (c: HTMLElement) => JSON.parse(c.querySelector('output')!.textContent!)

describe('TimePicker', () => {
  it('12h: hour keeps the period, minute keeps the hour, period flips; bind:value', async () => {
    const { container } = render(BindProbe, { props: { field: TimePicker, initial: '2:30 PM', props: { label: 'T' } } })
    await fireEvent.click(trigger(container))
    expect(dropdown()!.parentElement).toBe(document.body)
    expect(option(0, '2').hasAttribute('data-selected')).toBe(true)
    await fireEvent.click(option(0, '12'))
    expect(out(container)).toBe('12:30 PM')
    await fireEvent.click(option(1, '45'))
    expect(out(container)).toBe('12:45 PM')
    await fireEvent.click(option(2, 'AM'))
    expect(out(container)).toBe('12:45 AM')
    await fireEvent.click(option(2, 'PM'))
    await fireEvent.click(option(0, '3'))
    expect(out(container)).toBe('3:45 PM')
    expect(dropdown()).not.toBeNull() // stays open while picking
  })

  it('24h columns, minuteStep, and no period column', async () => {
    const { container } = render(TimePicker, { props: { label: 'T', format: '24h', minuteStep: 15 } })
    await fireEvent.click(trigger(container))
    expect(column(0).querySelectorAll('[role="option"]')).toHaveLength(24)
    expect(Array.from(column(1).querySelectorAll('[role="option"]')).map(b => b.textContent)).toEqual(['00', '15', '30', '45'])
    expect(dropdown()!.querySelectorAll('.ui-time-picker__column')).toHaveLength(2)
    await fireEvent.click(option(1, '15'))
    expect(trigger(container).textContent).toContain('00:15')
  })

  it('refuses times outside minTime/maxTime', async () => {
    const onChange = vi.fn()
    const { container } = render(TimePicker, { props: { label: 'T', format: '24h', minTime: '09:00', maxTime: '17:00', onChange } })
    await fireEvent.click(trigger(container))
    await fireEvent.click(option(0, '08'))
    expect(onChange).not.toHaveBeenCalled()
    await fireEvent.click(option(0, '09'))
    expect(onChange).toHaveBeenCalledWith('09:00')
  })

  it('clear empties without toggling; Escape and outside click close and return focus', async () => {
    vi.useFakeTimers()
    const onChange = vi.fn()
    const { container } = render(TimePicker, { props: { label: 'T', value: '9:00 AM', clearable: true, onChange } })
    await fireEvent.click(container.querySelector('.ui-time-picker__clear')!)
    expect(onChange).toHaveBeenCalledWith('')
    expect(dropdown()).toBeNull()
    await fireEvent.keyDown(trigger(container), { key: 'ArrowDown' })
    expect(dropdown()).not.toBeNull()
    await fireEvent.keyDown(dropdown()!, { key: 'Escape' })
    expect(dropdown()).toBeNull()
    expect(document.activeElement).toBe(trigger(container))
    await fireEvent.click(trigger(container))
    vi.runAllTimers()
    column(0).dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    flushSync()
    expect(dropdown()).not.toBeNull()
    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    flushSync()
    expect(dropdown()).toBeNull()
  })

  it('reports to the form (change, blur, error) but takes its value from props, as React does', async () => {
    const log: string[] = []
    const { container } = render(FormProbe, { props: { field: TimePicker, name: 't', initial: '1:00 PM', error: 'Late', props: { label: 'T' }, log } })
    expect(container.querySelector('.ui-time-picker__placeholder')).not.toBeNull()
    await fireEvent.click(trigger(container))
    await fireEvent.click(option(2, 'PM'))
    expect(log).toEqual(['change:"12:00 PM"'])
    await fireEvent.keyDown(dropdown()!, { key: 'Escape' })
    expect(log).toContain('blur')
    expect(container.querySelector('[role="alert"]')!.textContent).toBe('Late')
  })
})
