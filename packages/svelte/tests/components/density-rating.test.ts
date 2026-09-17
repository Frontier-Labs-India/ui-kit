import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import DensitySelector from '../../src/components/DensitySelector.svelte'
import Rating from '../../src/components/Rating.svelte'

describe('DensitySelector', () => {
  it('uncontrolled: selecting moves the checked radio and reports the value', async () => {
    const onChange = vi.fn()
    render(DensitySelector, { props: { onChange } })
    await fireEvent.click(screen.getByLabelText('spacious')); flushSync()
    expect(screen.getByLabelText('spacious').getAttribute('aria-checked')).toBe('true')
    expect(onChange).toHaveBeenCalledWith('spacious')
  })

  it('controlled: reports the choice but does not move until the prop changes', async () => {
    const onChange = vi.fn()
    render(DensitySelector, { props: { value: 'compact', onChange } })
    await fireEvent.click(screen.getByLabelText('spacious')); flushSync()
    expect(onChange).toHaveBeenCalledWith('spacious')
    expect(screen.getByLabelText('compact').getAttribute('aria-checked')).toBe('true')
  })
})

describe('Rating', () => {
  const slider = () => screen.getByRole('slider')

  it('clicking a star sets the value; keys step, clamp, and jump', async () => {
    const onChange = vi.fn()
    const { container } = render(Rating, { props: { onChange, allowHalf: true } })
    await fireEvent.click(container.querySelectorAll('.ui-rating__star')[2]); flushSync()
    expect(slider().getAttribute('aria-valuenow')).toBe('3')
    await fireEvent.keyDown(slider(), { key: 'ArrowRight' }); flushSync()
    expect(slider().getAttribute('aria-valuenow')).toBe('3.5')
    expect(container.querySelectorAll('.ui-rating__star')[3].getAttribute('data-state')).toBe('half')
    await fireEvent.keyDown(slider(), { key: 'End' })
    await fireEvent.keyDown(slider(), { key: 'ArrowUp' }); flushSync()
    expect(slider().getAttribute('aria-valuenow')).toBe('5')
    await fireEvent.keyDown(slider(), { key: 'Home' }); flushSync()
    expect(onChange.mock.calls.map(c => c[0])).toEqual([3, 3.5, 5, 0])
  })

  it('hover marks stars up to the pointer and clears on leave', async () => {
    const { container } = render(Rating, {})
    const stars = container.querySelectorAll('.ui-rating__star')
    await fireEvent.mouseEnter(stars[1]); flushSync()
    expect([...stars].map(s => s.getAttribute('data-hover'))).toEqual(['true', 'true', null, null, null])
    await fireEvent.mouseLeave(slider()); flushSync()
    expect(container.querySelector('[data-hover]')).toBeNull()
  })

  it('read-only ignores clicks, keys and hover', async () => {
    const onChange = vi.fn()
    const { container } = render(Rating, { props: { readOnly: true, defaultValue: 2, onChange } })
    await fireEvent.click(container.querySelectorAll('.ui-rating__star')[4])
    await fireEvent.keyDown(slider(), { key: 'End' })
    await fireEvent.mouseEnter(container.querySelectorAll('.ui-rating__star')[4]); flushSync()
    expect(onChange).not.toHaveBeenCalled()
    expect(slider().getAttribute('aria-valuenow')).toBe('2')
    expect(container.querySelector('[data-hover]')).toBeNull()
  })
})
