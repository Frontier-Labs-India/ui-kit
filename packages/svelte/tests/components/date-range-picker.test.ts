import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import DateRangePicker from '../../src/components/DateRangePicker.svelte'
import FormProbe from './form-probe.svelte'
import { CONTRACT_NOW } from '../contract/cases.js'

afterEach(() => { vi.useRealTimers(); cleanup() })

const trigger = (c: HTMLElement) => c.querySelector<HTMLButtonElement>('.ui-date-range-picker__trigger')!
const popover = () => document.body.querySelector<HTMLElement>(':scope > .ui-date-range-picker__popover')
const day = (m: number, d: number) => popover()!.querySelector<HTMLButtonElement>(`[data-day-key="2026-${m}-${d}"]:not([data-outside])`)!

describe('DateRangePicker', () => {
  it('two clicks pick a range (ordered), show range highlighting while choosing, then close', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(CONTRACT_NOW) // January 2026
    const onChange = vi.fn()
    const { container } = render(DateRangePicker, { props: { label: 'P', onChange } })
    await fireEvent.click(trigger(container))
    expect(popover()!.querySelectorAll('.ui-calendar__panel')).toHaveLength(2)
    await fireEvent.click(day(0, 20))
    expect(onChange.mock.calls[0][0][1]).toBeNull()
    expect(trigger(container).textContent).toContain('Jan 20')
    await fireEvent.mouseEnter(day(0, 10))
    expect(day(0, 15).hasAttribute('data-in-range')).toBe(true)
    expect(day(0, 10).hasAttribute('data-range-end')).toBe(true)
    await fireEvent.click(day(0, 10))
    const [start, end] = onChange.mock.calls[1][0] as [Date, Date]
    expect([start.getDate(), end.getDate()]).toEqual([10, 20])
    expect(popover()).toBeNull()
    expect(trigger(container).textContent).toContain('Jan 10 – Jan 20')
  })

  it('bind:value is two-way', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(CONTRACT_NOW)
    let value: [Date | null, Date | null] = [null, null]
    const { container } = render(DateRangePicker, {
      props: {
        label: 'P',
        get value() { return value },
        set value(v) { value = v },
      },
    })
    await fireEvent.click(trigger(container))
    await fireEvent.click(day(0, 3))
    expect(value[0]!.getDate()).toBe(3)
  })

  it('presets clamp to bounds, and wholly out-of-bounds presets are disabled', async () => {
    const onChange = vi.fn()
    const min = new Date(2026, 0, 10)
    const max = new Date(2026, 0, 20)
    const presets = [
      { label: 'Wide', range: [new Date(2026, 0, 1), new Date(2026, 0, 31)] as [Date, Date] },
      { label: 'Before', range: [new Date(2025, 11, 1), new Date(2025, 11, 5)] as [Date, Date] },
    ]
    const { container } = render(DateRangePicker, { props: { label: 'P', presets, minDate: min, maxDate: max, onChange } })
    await fireEvent.click(trigger(container))
    const buttons = Array.from(popover()!.querySelectorAll<HTMLButtonElement>('.ui-date-range-picker__preset-btn'))
    expect(buttons[1].disabled).toBe(true)
    await fireEvent.click(buttons[0])
    const [s, e] = onChange.mock.calls[0][0] as [Date, Date]
    expect([s.getDate(), e.getDate()]).toEqual([10, 20])
    expect(popover()).toBeNull()
  })

  it('clear empties without opening; Escape closes and returns focus; outside click closes', async () => {
    vi.useFakeTimers()
    const onChange = vi.fn()
    const { container } = render(DateRangePicker, { props: { label: 'P', value: [new Date(2026, 0, 1), new Date(2026, 0, 2)], onChange } })
    await fireEvent.click(container.querySelector('.ui-date-range-picker__clear')!)
    expect(onChange).toHaveBeenCalledWith([null, null])
    expect(popover()).toBeNull()
    await fireEvent.click(trigger(container))
    await fireEvent.keyDown(popover()!, { key: 'Escape' })
    expect(popover()).toBeNull()
    expect(document.activeElement).toBe(trigger(container))
    await fireEvent.click(trigger(container))
    vi.runAllTimers()
    popover()!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    flushSync()
    expect(popover()).not.toBeNull()
    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    flushSync()
    expect(popover()).toBeNull()
  })

  it('marks the form field touched on close and shows its error', async () => {
    const log: string[] = []
    const { container } = render(FormProbe, { props: { field: DateRangePicker, name: 'p', initial: null, error: 'Required', props: { label: 'P' }, log } })
    await fireEvent.click(trigger(container))
    await fireEvent.keyDown(popover()!, { key: 'Escape' })
    expect(log).toEqual(['blur'])
    expect(container.querySelector('[role="alert"]')!.textContent).toBe('Required')
  })
})
