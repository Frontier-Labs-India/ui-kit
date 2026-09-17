import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import PinInput from '../../src/components/PinInput.svelte'
import TagInput from '../../src/components/TagInput.svelte'

const type = async (el: HTMLInputElement, v: string) => { el.value = v; await fireEvent.input(el); flushSync() }

describe('PinInput', () => {
  it('fills digit by digit, advances focus, completes, and rejects non-digits', async () => {
    const onChange = vi.fn(), onComplete = vi.fn()
    const { container } = render(PinInput, { props: { length: 3, onChange, onComplete } })
    const inputs = () => [...container.querySelectorAll('input')] as HTMLInputElement[]
    await type(inputs()[0], '4')
    expect(document.activeElement).toBe(inputs()[1])
    await type(inputs()[1], 'x')
    expect(inputs()[1].value).toBe('')            // rejected, and cleared as React would
    await type(inputs()[1], '2'); await type(inputs()[2], '9')
    expect(onChange.mock.calls.map(c => c[0])).toEqual(['4', '42', '429'])
    expect(onComplete).toHaveBeenCalledWith('429')
  })

  it('backspace clears the digit, then moves back on an empty field', async () => {
    const { container } = render(PinInput, { props: { length: 3 } })
    const inputs = () => [...container.querySelectorAll('input')] as HTMLInputElement[]
    await type(inputs()[0], '1'); await type(inputs()[1], '2')
    await fireEvent.keyDown(inputs()[1], { key: 'Backspace' }); flushSync()
    expect(inputs()[1].value).toBe('')
    await fireEvent.keyDown(inputs()[1], { key: 'Backspace' }); flushSync()
    expect(document.activeElement).toBe(inputs()[0])
  })

  it('pastes a whole code and ignores an invalid paste', async () => {
    const onComplete = vi.fn()
    const { container } = render(PinInput, { props: { length: 4, onComplete } })
    const first = container.querySelector('input')!
    const paste = (text: string) => { const e = new Event('paste', { bubbles: true, cancelable: true }) as ClipboardEvent; Object.defineProperty(e, 'clipboardData', { value: { getData: () => text } }); first.dispatchEvent(e); flushSync() }
    paste('12ab')
    expect(onComplete).not.toHaveBeenCalled()
    paste('987654')
    expect(onComplete).toHaveBeenCalledWith('9876')
    expect([...container.querySelectorAll('input')].map(i => (i as HTMLInputElement).value)).toEqual(['9', '8', '7', '6'])
  })
})

describe('TagInput', () => {
  it('adds on Enter and comma, skips duplicates and invalid tags, removes on Backspace and click', async () => {
    const onChange = vi.fn()
    const { container } = render(TagInput, { props: { tags: [], onChange, validate: (t: string) => t !== 'bad', 'aria-label': 'Tags' } })
    const field = screen.getByLabelText('Tags') as HTMLInputElement
    const add = async (v: string, key: string) => { field.value = v; await fireEvent.input(field); await fireEvent.keyDown(field, { key }); flushSync() }
    await add('one', 'Enter'); await add('two,', ','); await add('one', 'Enter'); await add('bad', 'Enter')
    const tags = () => [...container.querySelectorAll('.ui-tag-input__tag > span')].map(s => s.textContent)
    expect(tags()).toEqual(['one', 'two'])
    expect(field.value).toBe('bad')                // a rejected tag stays in the field
    field.value = ''; await fireEvent.input(field)
    await fireEvent.keyDown(field, { key: 'Backspace' }); flushSync()
    expect(tags()).toEqual(['one'])
    await fireEvent.click(screen.getByLabelText('Remove one')); flushSync()
    expect(tags()).toEqual([])
    expect(onChange.mock.calls.at(-1)![0]).toEqual([])
  })

  it('stops at maxTags', async () => {
    const { container } = render(TagInput, { props: { tags: ['a'], maxTags: 1, 'aria-label': 'Tags' } })
    const field = screen.getByLabelText('Tags') as HTMLInputElement
    field.value = 'b'; await fireEvent.input(field); await fireEvent.keyDown(field, { key: 'Enter' }); flushSync()
    expect(container.querySelectorAll('.ui-tag-input__tag')).toHaveLength(1)
  })
})
