import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/svelte'
import Breadcrumbs from '../../src/components/Breadcrumbs.svelte'
import TimeRangeSelector from '../../src/components/TimeRangeSelector.svelte'

describe('Breadcrumbs', () => {
  const items = [{ label: 'Home', href: '/' }, { label: 'Docs', href: '/docs' }, { label: 'Now' }]

  it('onNavigate intercepts links that have an href', async () => {
    const onNavigate = vi.fn()
    render(Breadcrumbs, { props: { items, onNavigate } })
    const e = new MouseEvent('click', { bubbles: true, cancelable: true })
    screen.getByText('Docs').dispatchEvent(e)
    expect(onNavigate).toHaveBeenCalledWith('/docs')
    expect(e.defaultPrevented).toBe(true)
  })

  it('leaves navigation alone without onNavigate', () => {
    render(Breadcrumbs, { props: { items } })
    const e = new MouseEvent('click', { bubbles: true, cancelable: true })
    screen.getByText('Docs').dispatchEvent(e)
    expect(e.defaultPrevented).toBe(false)
  })
})

describe('TimeRangeSelector', () => {
  const presets = [{ label: '1h', value: '1h', range: [1000, 2000] as [number, number] }]

  it('calls onChange with a preset range', async () => {
    const onChange = vi.fn()
    render(TimeRangeSelector, { props: { presets, onChange } })
    await fireEvent.click(screen.getByText('1h'))
    expect(onChange).toHaveBeenCalledWith([1000, 2000])
  })

  it('keeps default presets stable across re-renders, so a matching value stays active', async () => {
    const { container, rerender } = render(TimeRangeSelector, { props: {} })
    const btn = () => container.querySelector('.ui-time-range-selector__preset') as HTMLButtonElement
    // Read the first default preset's range by clicking it with a capturing handler.
    let range: [number, number] | undefined
    await rerender({ onChange: (r: [number, number]) => { range = r } })
    await fireEvent.click(btn())
    expect(range).toBeDefined()
    await rerender({ value: range, onChange: () => {} })
    expect(btn().getAttribute('data-active')).toBe('true')
    await rerender({ value: range, showCustom: true, onChange: () => {} })
    expect(btn().getAttribute('data-active')).toBe('true')
  })

  it('custom start keeps the current end', async () => {
    const onChange = vi.fn()
    const { container } = render(TimeRangeSelector, { props: { presets, value: [0, 5000], showCustom: true, onChange } })
    const start = container.querySelectorAll('input')[0] as HTMLInputElement
    start.value = '2026-01-02T03:04'
    await fireEvent.change(start)
    expect(onChange).toHaveBeenCalledWith([Date.UTC(2026, 0, 2, 3, 4), 5000])
  })
})
