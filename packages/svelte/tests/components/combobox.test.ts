import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import Combobox from '../../src/components/Combobox.svelte'
import FormProbe from './form-probe.svelte'
import BindProbe from './value-bind-probe.svelte'

afterEach(() => { vi.useRealTimers() })

const options = [
  { value: 'svelte', label: 'Svelte', group: 'Compiled' },
  { value: 'solid', label: 'Solid', group: 'Compiled', description: 'Fine-grained' },
  { value: 'react', label: 'React', group: 'Runtime' },
  { value: 'angular', label: 'Angular', group: 'Runtime', disabled: true },
]
const inputOf = (c: HTMLElement) => c.querySelector<HTMLInputElement>('.ui-combobox__input')!
const typeIn = async (c: HTMLElement, text: string) => {
  const i = inputOf(c)
  i.value = text
  await fireEvent.input(i)
}
const key = (c: HTMLElement, k: string) => fireEvent.keyDown(inputOf(c), { key: k })

describe('Combobox', () => {
  it('shows the selected label while closed, and follows a changed value', async () => {
    const { container, rerender } = render(Combobox, { props: { name: 'fw', 'aria-label': 'F', options, value: 'react' } })
    expect(inputOf(container).value).toBe('React')
    await rerender({ name: 'fw', 'aria-label': 'F', options, value: 'solid' })
    flushSync()
    expect(inputOf(container).value).toBe('Solid')
  })

  it('open markup: listbox, groups, highlighted match, description, selection check, activedescendant', async () => {
    const { container } = render(Combobox, { props: { name: 'fw', label: 'Framework', options, value: 'solid' } })
    inputOf(container).focus()
    // Opening keeps the selected label as the query, as in React; clear it to see every option.
    await typeIn(container, '')
    const listbox = container.querySelector('[role="listbox"]')!
    expect(listbox.id).toBe(inputOf(container).getAttribute('aria-controls'))
    expect(listbox.getAttribute('aria-labelledby')).toBe(container.querySelector('label')!.id)
    expect(Array.from(container.querySelectorAll('.ui-combobox__group-header')).map(h => h.textContent)).toEqual(['Compiled', 'Runtime'])
    expect(container.querySelector('[data-selected] .ui-combobox__check')).not.toBeNull()
    expect(container.querySelector('[data-disabled]')!.getAttribute('aria-disabled')).toBe('true')
    expect(inputOf(container).getAttribute('aria-activedescendant')).toBe(container.querySelector('[data-active]')!.id)

    await typeIn(container, 'el')
    const labels = Array.from(container.querySelectorAll('.ui-combobox__option-label')).map(l => l.innerHTML.replace(/<!---->/g, ''))
    expect(labels).toEqual(['Sv<mark class="ui-combobox__match">el</mark>te'])
  })

  it('keyboard: arrows skip disabled options, Enter selects, Escape restores the label', async () => {
    const onChange = vi.fn()
    const { container } = render(BindProbe, { props: { field: Combobox, initial: '', props: { name: 'fw', 'aria-label': 'F', options, onChange } } })
    inputOf(container).focus() // opens at 0, as a real focus does
    await key(container, 'ArrowDown')
    await key(container, 'ArrowDown')
    await key(container, 'ArrowDown') // clamps: 3 enabled
    await key(container, 'Enter')
    expect(onChange).toHaveBeenCalledWith('react')
    expect(container.querySelector('output')!.textContent).toBe('"react"')
    expect(container.querySelector('[role="listbox"]')).toBeNull()
    await typeIn(container, 'sol')
    await key(container, 'Escape')
    expect(inputOf(container).value).toBe('React')
  })

  it('allowCreate offers "Create" for an unmatched query and reports it', async () => {
    const onCreate = vi.fn()
    const { container } = render(Combobox, { props: { name: 'fw', 'aria-label': 'F', options, allowCreate: true, onCreate } })
    await typeIn(container, 'Qwik')
    const create = container.querySelector('.ui-combobox__create')!
    expect(create.textContent).toBe('Create “Qwik”')
    expect(container.querySelector('.ui-combobox__empty')).toBeNull()
    await key(container, 'Enter')
    expect(onCreate).toHaveBeenCalledWith('Qwik')
    await typeIn(container, 'svelte') // exact label match: no create
    expect(container.querySelector('.ui-combobox__create')).toBeNull()
  })

  it('empty and loading states; onSearch hands filtering to the caller', async () => {
    const onSearch = vi.fn()
    const a = render(Combobox, { props: { name: 'a', 'aria-label': 'A', options } })
    await typeIn(a.container, 'zzz')
    expect(a.container.querySelector('.ui-combobox__empty')!.textContent).toBe('No results found')

    const b = render(Combobox, { props: { name: 'b', 'aria-label': 'B', options, loading: true } })
    await fireEvent.focus(inputOf(b.container))
    expect(b.container.querySelector('[role="status"]')!.textContent).toBe('Loading...')

    const c = render(Combobox, { props: { name: 'c', 'aria-label': 'C', options, onSearch } })
    await typeIn(c.container, 'zzz')
    expect(onSearch).toHaveBeenCalledWith('zzz')
    expect(c.container.querySelectorAll('[role="option"]')).toHaveLength(4)
  })

  it('closes on an outside mousedown (bound a tick after opening)', async () => {
    vi.useFakeTimers()
    const { container } = render(Combobox, { props: { name: 'fw', 'aria-label': 'F', options } })
    await fireEvent.focus(inputOf(container))
    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    expect(container.querySelector('[role="listbox"]')).not.toBeNull()
    vi.runAllTimers()
    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    flushSync()
    expect(container.querySelector('[role="listbox"]')).toBeNull()
  })

  it('consumes the form context: value, change, and touched-on-close error', async () => {
    const log: string[] = []
    const { container } = render(FormProbe, { props: { field: Combobox, name: 'fw', initial: 'svelte', error: 'Required', props: { options, 'aria-label': 'F' }, log } })
    expect(inputOf(container).value).toBe('Svelte')
    expect(container.querySelector<HTMLInputElement>('input[type="hidden"]')!.value).toBe('svelte')
    inputOf(container).focus()
    await typeIn(container, 'sol')
    await key(container, 'Enter')
    expect(log).toEqual(['change:"solid"'])
    await typeIn(container, 'x')
    await key(container, 'Escape')
    expect(log).toContain('blur')
    expect(container.querySelector('[role="alert"]')!.textContent).toBe('Required')
  })
})
