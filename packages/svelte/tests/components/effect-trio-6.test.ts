import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import SearchInput from '../../src/components/SearchInput.svelte'
import RadioGroup from '../../src/components/RadioGroup.svelte'
import InlineEdit from '../../src/components/InlineEdit.svelte'
import BindProbe from './value-bind-probe.svelte'

afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })
const out = (c: HTMLElement) => JSON.parse(c.querySelector('output')!.textContent!)

describe('SearchInput', () => {
  it('debounces onChange, Enter searches at once and cancels the pending change, clear resets (bind:value)', async () => {
    vi.useFakeTimers()
    const onChange = vi.fn()
    const onSearch = vi.fn()
    const onClear = vi.fn()
    const { container } = render(BindProbe, { props: { field: SearchInput, initial: '', props: { onChange, onSearch, onClear, debounce: 200 } } })
    const input = container.querySelector('input')!
    input.value = 'sv'
    await fireEvent.input(input)
    input.value = 'svelte'
    await fireEvent.input(input)
    expect(out(container)).toBe('svelte')
    vi.advanceTimersByTime(199)
    expect(onChange).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenCalledWith('svelte')
    input.value = 'svelte5'
    await fireEvent.input(input)
    await fireEvent.keyDown(input, { key: 'Enter' })
    expect(onSearch).toHaveBeenCalledWith('svelte5')
    vi.advanceTimersByTime(500)
    expect(onChange).toHaveBeenCalledOnce()
    await fireEvent.click(container.querySelector('.ui-search-input__clear')!)
    expect(out(container)).toBe('')
    expect(onChange).toHaveBeenLastCalledWith('')
    expect(onClear).toHaveBeenCalledOnce()
    expect(container.querySelector('.ui-search-input__clear')).toBeNull()
  })
})

describe('RadioGroup', () => {
  const options = [{ value: 'a', label: 'A' }, { value: 'b', label: 'B', disabled: true }, { value: 'c', label: 'C' }]
  const radios = (c: HTMLElement) => Array.from(c.querySelectorAll<HTMLInputElement>('input[type="radio"]'))

  it('arrows move focus and select, skipping disabled and wrapping; horizontal uses Left/Right (bind:value)', async () => {
    const onChange = vi.fn()
    const { container } = render(BindProbe, { props: { field: RadioGroup, initial: 'a', props: { name: 'g', label: 'G', options, onChange } } })
    const [a, , c] = radios(container)
    a.focus()
    await fireEvent.keyDown(a, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(c)
    expect(out(container)).toBe('c')
    expect(c.tabIndex).toBe(0)
    await fireEvent.keyDown(c, { key: 'ArrowDown' })
    expect(out(container)).toBe('a')
    await fireEvent.keyDown(a, { key: 'ArrowRight' }) // vertical: ignored
    expect(out(container)).toBe('a')
    await fireEvent.keyDown(a, { key: 'End' })
    expect(onChange).toHaveBeenLastCalledWith('c')

    const h = render(RadioGroup, { props: { name: 'h', label: 'H', options, orientation: 'horizontal', defaultValue: 'a' } })
    const [ha, , hc] = radios(h.container)
    ha.focus()
    await fireEvent.keyDown(ha, { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(hc)
    expect(hc.checked).toBe(true)
  })
})

describe('InlineEdit', () => {
  it('click edits with the field focused and selected; Enter saves once and returns focus next frame (bind:value)', async () => {
    const frames: FrameRequestCallback[] = []
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(f => { frames.push(f); return frames.length })
    const onChange = vi.fn()
    const onSave = vi.fn()
    const { container } = render(BindProbe, { props: { field: InlineEdit, initial: 'Old', props: { onChange, onSave } } })
    await fireEvent.click(container.querySelector('[role="button"]')!)
    const input = container.querySelector<HTMLInputElement>('input')!
    expect(document.activeElement).toBe(input)
    expect([input.selectionStart, input.selectionEnd]).toEqual([0, 3])
    input.value = 'New'
    await fireEvent.input(input)
    await fireEvent.keyDown(input, { key: 'Enter' })
    await fireEvent.blur(input)
    expect(onChange).toHaveBeenCalledOnce()
    expect(onSave).toHaveBeenCalledWith('New')
    expect(out(container)).toBe('New')
    frames.shift()!(0)
    expect(document.activeElement).toBe(container.querySelector('[role="button"]'))
  })

  it('Escape cancels without saving; blur saves; dblclick trigger; multiline needs Ctrl+Enter; disabled does nothing', async () => {
    const onChange = vi.fn()
    const onCancel = vi.fn()
    const a = render(InlineEdit, { props: { value: 'x', onChange, onCancel } })
    await fireEvent.click(a.container.querySelector('[role="button"]')!)
    const input = a.container.querySelector('input')!
    input.value = 'y'
    await fireEvent.input(input)
    await fireEvent.keyDown(input, { key: 'Escape' })
    expect(onCancel).toHaveBeenCalledOnce()
    expect(onChange).not.toHaveBeenCalled()

    const b = render(InlineEdit, { props: { value: 'x', onChange, editTrigger: 'dblclick', multiline: true } })
    const display = b.container.querySelector('[role="button"]')!
    await fireEvent.click(display)
    expect(b.container.querySelector('textarea')).toBeNull()
    await fireEvent.dblClick(display)
    const ta = b.container.querySelector('textarea')!
    await fireEvent.keyDown(ta, { key: 'Enter' })
    expect(onChange).not.toHaveBeenCalled()
    await fireEvent.keyDown(ta, { key: 'Enter', ctrlKey: true })
    expect(onChange).toHaveBeenCalledWith('x')

    const c = render(InlineEdit, { props: { value: 'x', onChange, disabled: true } })
    await fireEvent.click(c.container.querySelector('[role="button"]')!)
    expect(c.container.querySelector('input')).toBeNull()
  })
})
