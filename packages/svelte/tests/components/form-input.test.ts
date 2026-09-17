import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/svelte'
import FormInput from '../../src/components/FormInput.svelte'
import FormProbe from './form-probe.svelte'
import BindProbe from './form-input-bind-probe.svelte'

const type = async (el: HTMLInputElement, text: string) => {
  el.value = text
  await fireEvent.input(el)
}

describe('FormInput', () => {
  it('bind:value is two-way from an undefined start', async () => {
    const { container } = render(BindProbe)
    const input = container.querySelector('input')!
    await type(input, 'hello')
    expect(container.querySelector('output')!.textContent).toBe('hello')
  })

  it('uncontrolled typing drives the counter and clear button; oninput and onblur still fire', async () => {
    const oninput = vi.fn()
    const onblur = vi.fn()
    const onClear = vi.fn()
    const { container } = render(FormInput, { props: { name: 'x', maxLength: 5, clearable: true, onClear, oninput, onblur } })
    const input = container.querySelector('input')!
    expect(container.querySelector('.ui-form-input__clear')).toBeNull()
    await type(input, 'abcde')
    expect(container.querySelector('.ui-form-input__counter')!.textContent).toBe('5/5')
    expect(container.querySelector('.ui-form-input__counter')!.hasAttribute('data-at-limit')).toBe(true)
    expect(oninput).toHaveBeenCalledOnce()
    await fireEvent.click(container.querySelector('.ui-form-input__clear')!)
    expect(onClear).toHaveBeenCalledOnce()
    await fireEvent.blur(input)
    expect(onblur).toHaveBeenCalledOnce()
  })

  it('consumes the form context: value, change, blur, and the error only once touched', async () => {
    const log: string[] = []
    const { container } = render(FormProbe, { props: { field: FormInput, initial: 'from form', error: 'Too short', props: { 'aria-label': 'F' }, log } })
    const input = container.querySelector('input')!
    expect(input.value).toBe('from form')
    expect(container.querySelector('[role="alert"]')).toBeNull()
    await type(input, 'typed')
    expect(log).toEqual(['change:"typed"'])
    expect(container.querySelector('output')!.textContent).toBe('"typed"')
    await fireEvent.blur(input)
    expect(log).toContain('blur')
    expect(container.querySelector('[role="alert"]')!.textContent).toBe('Too short')
    expect(input.getAttribute('aria-invalid')).toBe('true')
  })

  it('an explicit value and error override the form context', async () => {
    const log: string[] = []
    const { container } = render(FormProbe, { props: { field: FormInput, initial: 'form', error: 'ctx', props: { 'aria-label': 'F', value: 'mine', error: '' }, log } })
    const input = container.querySelector('input')!
    expect(input.value).toBe('mine')
    await type(input, 'mine2')
    expect(log).toEqual([])
    await fireEvent.blur(input)
    expect(container.querySelector('[role="alert"]')).toBeNull()
  })
})
