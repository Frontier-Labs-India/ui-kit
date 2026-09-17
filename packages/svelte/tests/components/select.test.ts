import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import Select from '../../src/components/Select.svelte'
import FormProbe from './form-probe.svelte'
import BindProbe from './value-bind-probe.svelte'

afterEach(() => { vi.useRealTimers(); cleanup() })

const options = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana', disabled: true },
  { value: 'cherry', label: 'Cherry' },
  { value: 'date', label: 'Date' },
]
const triggerOf = (c: HTMLElement) => c.querySelector<HTMLButtonElement>('.ui-select__trigger')!
const listbox = () => document.body.querySelector<HTMLElement>(':scope > .ui-select__dropdown')
const activeLabel = () => listbox()!.querySelector('[data-active]')?.textContent
const key = (el: Element, k: string) => fireEvent.keyDown(el, { key: k })

describe('Select', () => {
  it('portals the listbox to <body>, focuses it, and wires aria-controls', async () => {
    const { container } = render(Select, { props: { name: 's', label: 'Fruit', options } })
    await fireEvent.click(triggerOf(container))
    const lb = listbox()!
    expect(container.contains(lb)).toBe(false)
    expect(triggerOf(container).getAttribute('aria-controls')).toBe(lb.id)
    expect(document.activeElement).toBe(lb)
    expect(lb.getAttribute('aria-labelledby')).toBe(container.querySelector('label')!.id)
  })

  it('keyboard: opens from the trigger at the selected option, skips disabled, typeahead, Space selects and closes', async () => {
    const onChange = vi.fn()
    const { container } = render(BindProbe, { props: { field: Select, initial: 'cherry', props: { name: 's', label: 'F', options, onChange } } })
    await key(triggerOf(container), 'ArrowDown')
    expect(activeLabel()).toBe('Cherry')
    await key(listbox()!, 'ArrowUp')
    expect(activeLabel()).toBe('Apple')
    await key(listbox()!, 'd')
    expect(activeLabel()).toBe('Date')
    await key(listbox()!, ' ')
    expect(onChange).toHaveBeenCalledWith('date')
    expect(container.querySelector('output')!.textContent).toBe('"date"')
    expect(listbox()).toBeNull()
    expect(document.activeElement).toBe(triggerOf(container))
  })

  it('multiple toggles values and stays open; tags collapse past three', async () => {
    const { container } = render(BindProbe, { props: { field: Select, initial: [], props: { name: 's', label: 'F', options, multiple: true } } })
    await fireEvent.click(triggerOf(container))
    const opts = () => Array.from(listbox()!.querySelectorAll('[role="option"]'))
    await fireEvent.click(opts()[0])
    await fireEvent.click(opts()[2])
    await fireEvent.click(opts()[3])
    expect(listbox()).not.toBeNull()
    expect(container.querySelector('output')!.textContent).toBe('["apple","cherry","date"]')
    await fireEvent.click(opts()[0])
    expect(container.querySelector('output')!.textContent).toBe('["cherry","date"]')
    expect(Array.from(container.querySelectorAll<HTMLInputElement>('input[type="hidden"]')).map(i => i.value)).toEqual(['cherry', 'date'])
    expect(listbox()!.getAttribute('aria-multiselectable')).toBe('true')
  })

  it('clear empties the value without toggling the dropdown', async () => {
    const onChange = vi.fn()
    const { container } = render(Select, { props: { name: 's', label: 'F', options, defaultValue: 'apple', clearable: true, onChange } })
    await fireEvent.click(container.querySelector('.ui-select__clear')!)
    expect(onChange).toHaveBeenCalledWith('')
    expect(listbox()).toBeNull()
    expect(container.querySelector('.ui-select__placeholder')!.textContent).toBe('Select...')
  })

  it('searchable: filters, focuses the search box, handles each key once, and keeps Space for typing', async () => {
    const { container } = render(Select, { props: { name: 's', label: 'F', options, searchable: true } })
    await fireEvent.click(triggerOf(container))
    const search = listbox()!.querySelector<HTMLInputElement>('.ui-select__search')!
    expect(document.activeElement).toBe(search)
    await key(search, 'ArrowDown')
    expect(activeLabel()).toBe('Cherry') // one step over the disabled Banana, not two
    search.value = 'an'
    await fireEvent.input(search)
    expect(Array.from(listbox()!.querySelectorAll('[role="option"]')).map(o => o.textContent)).toEqual(['Banana'])
    const space = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true })
    search.dispatchEvent(space)
    expect(space.defaultPrevented).toBe(false)
    search.value = 'zz'
    await fireEvent.input(search)
    expect(listbox()!.querySelector('.ui-select__empty')!.textContent).toBe('No options found')
  })

  it('outside mousedown closes; inside the portalled listbox does not', async () => {
    vi.useFakeTimers()
    const { container } = render(Select, { props: { name: 's', label: 'F', options } })
    await fireEvent.click(triggerOf(container))
    vi.runAllTimers()
    listbox()!.querySelector('[role="option"]')!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    flushSync()
    expect(listbox()).not.toBeNull()
    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    flushSync()
    expect(listbox()).toBeNull()
  })

  it('consumes the form context', async () => {
    const log: string[] = []
    const { container } = render(FormProbe, { props: { field: Select, name: 's', initial: 'apple', error: 'Nope', props: { options, label: 'F' }, log } })
    expect(triggerOf(container).textContent).toContain('Apple')
    await fireEvent.click(triggerOf(container))
    await fireEvent.click(listbox()!.querySelectorAll('[role="option"]')[2])
    expect(log).toEqual(['change:"cherry"', 'blur'])
    expect(container.querySelector('[role="alert"]')!.textContent).toBe('Nope')
  })

  it('removes the portalled listbox when destroyed while open', async () => {
    const { container, unmount } = render(Select, { props: { name: 's', label: 'F', options } })
    await fireEvent.click(triggerOf(container))
    expect(listbox()).not.toBeNull()
    unmount()
    expect(listbox()).toBeNull()
  })
})
