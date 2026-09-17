import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import LogViewer from '../../src/components/LogViewer.svelte'
import ColumnVisibilityToggle from '../../src/components/ColumnVisibilityToggle.svelte'
import OtpInput from '../../src/components/OtpInput.svelte'
import BindProbe from './value-bind-probe.svelte'

afterEach(() => { vi.restoreAllMocks() })

describe('LogViewer', () => {
  it('virtualises above 100 lines: renders a window around the scroll position', async () => {
    const lines = Array.from({ length: 1000 }, (_, i) => ({ id: i, message: `line ${i}` }))
    const { container } = render(LogViewer, { props: { lines, height: '210px' } })
    const scroll = container.querySelector<HTMLElement>('.ui-log-viewer__scroll')!
    const shown = () => Array.from(container.querySelectorAll('.ui-log-viewer__message')).map(m => m.textContent)
    expect(container.querySelector<HTMLElement>('.ui-log-viewer__virtual-spacer')!.style.height).toBe('21000px')
    expect(shown()).toHaveLength(Math.ceil(210 / 21) + 20)
    expect(shown()[0]).toBe('line 0')
    scroll.scrollTop = 21 * 500
    await fireEvent.scroll(scroll)
    expect(shown()[0]).toBe('line 490')
    expect((scroll.lastElementChild as HTMLElement).style.transform).toBe(`translateY(${490 * 21}px)`)
  })

  it('tails new lines when autoTail', async () => {
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(777)
    const { container, rerender } = render(LogViewer, { props: { lines: [{ id: 1, message: 'a' }], autoTail: true } })
    const scroll = container.querySelector<HTMLElement>('.ui-log-viewer__scroll')!
    await rerender({ lines: [{ id: 1, message: 'a' }, { id: 2, message: 'b' }], autoTail: true })
    flushSync()
    expect(scroll.scrollTop).toBe(777)
  })
})

describe('ColumnVisibilityToggle', () => {
  it('reports toggles and keeps each checkbox on the caller data (React controlled)', async () => {
    const onChange = vi.fn()
    const { container, getByRole } = render(ColumnVisibilityToggle, { props: { columns: [{ id: 'a', label: 'Name', visible: true }], onChange } })
    await fireEvent.click(getByRole('button', { name: /Columns/ }))
    expect(container.querySelector('[role="listbox"]')!.getAttribute('data-open')).toBe('true')
    const box = container.querySelector<HTMLInputElement>('input')!
    await fireEvent.click(box)
    expect(onChange).toHaveBeenCalledWith('a', false)
    expect(box.checked).toBe(true)
  })

  it('closes on Escape and outside mousedown', async () => {
    const { container, getByRole } = render(ColumnVisibilityToggle, { props: { columns: [] } })
    const list = () => container.querySelector('[role="listbox"]')!.getAttribute('data-open')
    await fireEvent.click(getByRole('button', { name: /Columns/ }))
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    flushSync()
    expect(list()).toBe('false')
    await fireEvent.click(getByRole('button', { name: /Columns/ }))
    container.querySelector('button')!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    flushSync()
    expect(list()).toBe('true')
    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    flushSync()
    expect(list()).toBe('false')
  })
})

describe('OtpInput', () => {
  const inputs = (c: HTMLElement) => Array.from(c.querySelectorAll<HTMLInputElement>('input'))
  const type = async (el: HTMLInputElement, text: string) => { el.value = text; await fireEvent.input(el) }

  it('types digit by digit with auto-advance, rejects non-digits, completes (bind:value)', async () => {
    const onComplete = vi.fn()
    const { container } = render(BindProbe, { props: { field: OtpInput, initial: '', props: { length: 3, onComplete, 'aria-label': 'C' } } })
    const [a, b, c] = inputs(container)
    await type(a, '1')
    expect(document.activeElement).toBe(b)
    await type(b, 'x')
    expect(b.value).toBe('')
    await type(b, '2')
    await type(c, '3')
    expect(container.querySelector('output')!.textContent).toBe('"123"')
    expect(onComplete).toHaveBeenCalledWith('123')
  })

  it('Backspace clears the digit or moves back; paste fills and focuses', async () => {
    const onChange = vi.fn()
    const { container } = render(OtpInput, { props: { length: 4, onChange, 'aria-label': 'C' } })
    const els = inputs(container)
    const paste = new Event('paste', { bubbles: true, cancelable: true }) as ClipboardEvent
    Object.defineProperty(paste, 'clipboardData', { value: { getData: () => '98765' } })
    els[0].dispatchEvent(paste)
    flushSync()
    expect(paste.defaultPrevented).toBe(true)
    expect(onChange).toHaveBeenLastCalledWith('9876')
    expect(document.activeElement).toBe(els[3])
    await fireEvent.keyDown(els[3], { key: 'Backspace' })
    expect(onChange).toHaveBeenLastCalledWith('987')
    await fireEvent.keyDown(els[3], { key: 'Backspace' })
    expect(document.activeElement).toBe(els[2])
  })

  it('autoFocus focuses the first digit', () => {
    const { container } = render(OtpInput, { props: { autoFocus: true, 'aria-label': 'C' } })
    expect(document.activeElement).toBe(container.querySelector('input'))
  })
})
