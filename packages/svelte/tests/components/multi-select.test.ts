import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import MultiSelect from '../../src/components/MultiSelect.svelte'
import FormProbe from './form-probe.svelte'
import BindProbe from './value-bind-probe.svelte'

afterEach(() => { vi.useRealTimers() })

const options = [
  { value: 'a', label: 'Alpha', group: 'G1' },
  { value: 'b', label: 'Beta', group: 'G1', disabled: true },
  { value: 'c', label: 'Gamma', group: 'G2' },
  { value: 'd', label: 'Delta', group: 'G2' },
]
const inputOf = (c: HTMLElement) => c.querySelector<HTMLInputElement>('.ui-multi-select__input')!
const out = (c: HTMLElement) => JSON.parse(c.querySelector('output')!.textContent!)
const key = (c: HTMLElement, k: string) => fireEvent.keyDown(inputOf(c), { key: k })

describe('MultiSelect', () => {
  it('open markup: groups, checkboxes, aria-multiselectable, activedescendant', async () => {
    const { container } = render(MultiSelect, { props: { label: 'T', options, value: ['c'] } })
    inputOf(container).focus()
    flushSync()
    const lb = container.querySelector('[role="listbox"]')!
    expect(lb.getAttribute('aria-multiselectable')).toBe('true')
    expect(inputOf(container).getAttribute('aria-controls')).toBe(lb.id)
    expect(Array.from(container.querySelectorAll('.ui-multi-select__group-header')).map(h => h.textContent)).toEqual(['G1', 'G2'])
    // Target the label leaf: Svelte keeps a space text node between the checkbox and label spans.
    expect(document.getElementById(inputOf(container).getAttribute('aria-activedescendant')!)!
      .querySelector('.ui-multi-select__option-label')!.textContent).toBe('Alpha')
    expect(container.querySelectorAll('[data-checked]')).toHaveLength(1)
  })

  it('keyboard toggles with Enter/Space, stays open, skips disabled; Backspace removes the last tag', async () => {
    const { container } = render(BindProbe, { props: { field: MultiSelect, initial: [], props: { label: 'T', options, name: 't' } } })
    inputOf(container).focus()
    flushSync()
    await key(container, 'Enter') // Alpha
    await key(container, 'ArrowDown') // Gamma (Beta disabled)
    await key(container, ' ')
    expect(out(container)).toEqual(['a', 'c'])
    expect(container.querySelector('[role="listbox"]')).not.toBeNull()
    expect(Array.from(container.querySelectorAll<HTMLInputElement>('input[type="hidden"]')).map(i => i.value)).toEqual(['a', 'c'])
    await key(container, 'Backspace')
    expect(out(container)).toEqual(['a'])
    await key(container, 'Escape')
    expect(container.querySelector('[role="listbox"]')).toBeNull()
  })

  it('maxSelected refuses more; tag remove and clear all do not open the dropdown', async () => {
    const onChange = vi.fn()
    const { container } = render(MultiSelect, { props: { label: 'T', options, defaultValue: ['a', 'c'], maxSelected: 2, clearable: true, onChange } })
    inputOf(container).focus()
    flushSync()
    await fireEvent.click(container.querySelectorAll('[role="option"]')[3]) // Delta
    expect(onChange).not.toHaveBeenCalled()
    await key(container, 'Escape')
    await fireEvent.click(container.querySelector('[aria-label="Remove Alpha"]')!)
    expect(onChange).toHaveBeenLastCalledWith(['c'])
    expect(container.querySelector('[role="listbox"]')).toBeNull()
    await fireEvent.click(container.querySelector('[aria-label="Clear all selections"]')!)
    expect(onChange).toHaveBeenLastCalledWith([])
  })

  it('search filters and resets after a toggle; empty state', async () => {
    const { container } = render(MultiSelect, { props: { label: 'T', options } })
    inputOf(container).focus()
    flushSync()
    inputOf(container).value = 'ta'
    await fireEvent.input(inputOf(container))
    expect(Array.from(container.querySelectorAll('.ui-multi-select__option-label')).map(o => o.textContent)).toEqual(['Beta', 'Delta'])
    await key(container, 'Enter')
    expect(inputOf(container).value).toBe('')
    inputOf(container).value = 'zzz'
    await fireEvent.input(inputOf(container))
    expect(container.querySelector('.ui-multi-select__empty')!.textContent).toBe('No options found')
  })

  it('closes on outside mousedown and marks the form field touched', async () => {
    vi.useFakeTimers()
    const log: string[] = []
    const { container } = render(FormProbe, { props: { field: MultiSelect, name: 't', initial: ['d'], error: 'Pick 2', props: { options, label: 'T' }, log } })
    expect(container.querySelector('.ui-multi-select__tag')!.textContent).toContain('Delta')
    inputOf(container).focus()
    flushSync()
    await key(container, 'Enter')
    expect(log).toEqual(['change:["d","a"]'])
    vi.runAllTimers()
    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    flushSync()
    expect(container.querySelector('[role="listbox"]')).toBeNull()
    expect(log).toContain('blur')
    expect(container.querySelector('[role="alert"]')!.textContent).toBe('Pick 2')
  })
})
