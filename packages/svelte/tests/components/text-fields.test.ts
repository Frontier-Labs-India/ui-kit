import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import Textarea from '../../src/components/Textarea.svelte'
import PasswordInput from '../../src/components/PasswordInput.svelte'
import NumberInput from '../../src/components/NumberInput.svelte'
import FormProbe from './form-probe.svelte'
import BindProbe from './value-bind-probe.svelte'

afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })

const type = async (el: HTMLInputElement | HTMLTextAreaElement, text: string) => {
  el.value = text
  await fireEvent.input(el)
}
const out = (c: HTMLElement) => JSON.parse(c.querySelector('output')!.textContent!)

describe('Textarea', () => {
  it('uncontrolled from defaultValue; typing updates the counter and calls onChange with the event', async () => {
    const onChange = vi.fn()
    const { container } = render(Textarea, { props: { label: 'B', defaultValue: 'hi', showCount: true, onChange } })
    const ta = container.querySelector('textarea')!
    expect(ta.value).toBe('hi')
    await type(ta, 'hello')
    expect(container.querySelector('.ui-textarea__counter')!.textContent).toBe('5')
    expect(onChange.mock.calls[0][0]).toBeInstanceOf(Event)
  })

  it('bind:value is two-way', async () => {
    const { container } = render(BindProbe, { props: { field: Textarea, initial: 'a', props: { label: 'B' } } })
    await type(container.querySelector('textarea')!, 'abc')
    expect(out(container)).toBe('abc')
  })

  it('consumes the form context', async () => {
    const log: string[] = []
    const { container } = render(FormProbe, { props: { field: Textarea, initial: 'ctx', error: 'Bad', props: { label: 'B' }, log } })
    const ta = container.querySelector('textarea')!
    expect(ta.value).toBe('ctx')
    await type(ta, 'new')
    expect(log).toEqual(['change:"new"'])
    await fireEvent.blur(ta)
    expect(container.querySelector('[role="alert"]')!.textContent).toBe('Bad')
  })

  it('autoResize sets height between the row bounds and shows a scrollbar past maxRows', async () => {
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      lineHeight: '20px', fontSize: '16px', paddingTop: '4px', paddingBottom: '4px', borderTopWidth: '1px', borderBottomWidth: '1px',
    } as CSSStyleDeclaration)
    let scroll = 10
    vi.spyOn(HTMLTextAreaElement.prototype, 'scrollHeight', 'get').mockImplementation(() => scroll)
    const { container } = render(Textarea, { props: { label: 'A', autoResize: true, minRows: 2, maxRows: 4 } })
    const ta = container.querySelector('textarea')!
    expect(ta.style.height).toBe('50px') // 2 rows + 8 padding + 2 border
    expect(ta.style.overflow).toBe('hidden')
    scroll = 200
    await type(ta, 'lots')
    expect(ta.style.height).toBe('90px') // capped at 4 rows
    expect(ta.style.overflow).toBe('auto')
  })
})

describe('PasswordInput', () => {
  it('toggles visibility and reports strength on mount and change', async () => {
    const onStrengthChange = vi.fn()
    const { container, getByLabelText } = render(BindProbe, {
      props: { field: PasswordInput, initial: '', props: { label: 'P', showStrengthMeter: true, onStrengthChange } },
    })
    const input = getByLabelText('P') as HTMLInputElement
    expect(onStrengthChange).toHaveBeenLastCalledWith(0)
    await type(input, 'Abcdef1!')
    flushSync()
    expect(out(container)).toBe('Abcdef1!')
    expect(onStrengthChange).toHaveBeenLastCalledWith(4)
    expect(container.querySelectorAll('[data-active]')).toHaveLength(4)
    expect(input.type).toBe('password')
    await fireEvent.click(getByLabelText('Show password'))
    expect(input.type).toBe('text')
    expect(getByLabelText('Hide password')).toBeTruthy()
  })

  it('consumes the form context', async () => {
    const log: string[] = []
    const { container } = render(FormProbe, { props: { field: PasswordInput, initial: 'secret', props: { label: 'P', showStrengthMeter: true }, log } })
    const input = container.querySelector('input')!
    expect(input.value).toBe('secret')
    await type(input, 'secret99')
    expect(log).toEqual(['change:"secret99"'])
    expect(container.querySelector('[role="meter"]')!.getAttribute('aria-valuenow')).toBe('3') // length, lower, digit
  })
})

describe('NumberInput', () => {
  it('steps with arrows (shift ×10), clamps, and respects allowNegative', async () => {
    const onChange = vi.fn()
    const { container } = render(BindProbe, { props: { field: NumberInput, initial: 5, props: { label: 'N', min: 0, max: 20, onChange } } })
    const input = container.querySelector('input')!
    await fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(out(container)).toBe(6)
    await fireEvent.keyDown(input, { key: 'ArrowUp', shiftKey: true })
    expect(out(container)).toBe(16)
    await fireEvent.keyDown(input, { key: 'ArrowUp', shiftKey: true })
    expect(out(container)).toBe(20)
    expect(onChange).toHaveBeenLastCalledWith(20)
    expect((container.querySelector('[aria-label="Increment"]') as HTMLButtonElement).disabled).toBe(true)

    const b = render(NumberInput, { props: { label: 'M', defaultValue: 0, allowNegative: false } })
    await fireEvent.keyDown(b.container.querySelector('input')!, { key: 'ArrowDown' })
    expect(b.container.querySelector('input')!.getAttribute('aria-valuenow')).toBe('0')
  })

  it('shows raw text while focused, formats on blur, and clamps on blur by default', async () => {
    const onChange = vi.fn()
    const { container } = render(NumberInput, { props: { label: 'P', defaultValue: 1500, max: 5000, thousandSeparator: true, prefix: '$', onChange } })
    const input = container.querySelector('input')!
    expect(input.value).toBe('$1,500')
    await fireEvent.focus(input)
    expect(input.value).toBe('1500')
    await type(input, '9000')
    expect(onChange).toHaveBeenLastCalledWith(9000)
    await fireEvent.blur(input)
    expect(onChange).toHaveBeenLastCalledWith(5000)
    expect(input.value).toBe('$5,000')
  })

  it('strict clamping clamps while typing; invalid text is ignored; empty is null', async () => {
    const onChange = vi.fn()
    const { container } = render(NumberInput, { props: { label: 'S', min: 1, max: 10, clampBehavior: 'strict', allowDecimal: false, onChange } })
    const input = container.querySelector('input')!
    await fireEvent.focus(input)
    await type(input, '50')
    expect(onChange).toHaveBeenLastCalledWith(10)
    await type(input, '2.5')
    expect(onChange).toHaveBeenCalledTimes(1)
    await type(input, '')
    expect(onChange).toHaveBeenLastCalledWith(null)
  })

  it('hold-to-repeat starts after 400ms, repeats every 60ms, and stops on mouseup', async () => {
    vi.useFakeTimers()
    const onChange = vi.fn()
    const { container } = render(NumberInput, { props: { label: 'H', defaultValue: 0, onChange } })
    const inc = container.querySelector('[aria-label="Increment"]')!
    await fireEvent.mouseDown(inc)
    expect(onChange).toHaveBeenLastCalledWith(1)
    vi.advanceTimersByTime(400 + 60 * 3)
    expect(onChange).toHaveBeenLastCalledWith(4)
    await fireEvent.mouseUp(inc)
    vi.advanceTimersByTime(1000)
    expect(onChange).toHaveBeenLastCalledWith(4)
  })

  it('wheel steps only while focused', async () => {
    const onChange = vi.fn()
    const { container } = render(NumberInput, { props: { label: 'W', defaultValue: 1, onChange } })
    const input = container.querySelector('input')!
    input.dispatchEvent(new WheelEvent('wheel', { deltaY: -1, cancelable: true }))
    expect(onChange).not.toHaveBeenCalled()
    input.focus()
    const e = new WheelEvent('wheel', { deltaY: -1, cancelable: true })
    input.dispatchEvent(e)
    expect(e.defaultPrevented).toBe(true)
    expect(onChange).toHaveBeenLastCalledWith(2)
  })

  it('consumes the form context', async () => {
    const log: string[] = []
    const { container } = render(FormProbe, { props: { field: NumberInput, initial: 7, error: 'Odd', props: { label: 'N' }, log } })
    const input = container.querySelector('input')!
    expect(input.value).toBe('7')
    await fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(log).toEqual(['change:8'])
    await fireEvent.blur(input)
    expect(container.querySelector('[role="alert"]')!.textContent).toBe('Odd')
  })
})
