import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent, within } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import RichTextEditor from '../../src/components/RichTextEditor.svelte'

afterEach(() => { vi.restoreAllMocks() })

function commands() {
  const calls: [string, string | undefined][] = []
  Object.assign(document, {
    execCommand: vi.fn((c: string, _u: boolean, v?: string) => { calls.push([c, v]); return true }),
    queryCommandState: vi.fn(() => false),
    queryCommandValue: vi.fn(() => ''),
  })
  return calls
}
const editorOf = (c: HTMLElement) => c.querySelector<HTMLElement>('.ui-rich-text-editor__editor')!

describe('RichTextEditor', () => {
  it('sanitizes an incoming value and defaultValue before showing them', async () => {
    commands()
    const hostile = '<p>hi<script>alert(1)</script><img src=x onerror="alert(2)"><a href="javascript:alert(3)">x</a></p>'
    const a = render(RichTextEditor, { props: { value: hostile } })
    const html = editorOf(a.container).innerHTML
    expect(html).not.toMatch(/script|onerror|javascript:/)
    expect(html).toContain('<p>hi')
    const b = render(RichTextEditor, { props: { defaultValue: hostile } })
    expect(editorOf(b.container).innerHTML).not.toMatch(/script|onerror|javascript:/)
  })

  it('reports sanitized HTML on input, and "" when only a <br> is left; no repeat for unchanged HTML', async () => {
    commands()
    const onChange = vi.fn()
    const { container } = render(RichTextEditor, { props: { onChange } })
    const ed = editorOf(container)
    ed.innerHTML = '<p onclick="x()">Hello <b>world</b></p>'
    await fireEvent.input(ed)
    expect(onChange).toHaveBeenLastCalledWith('<p>Hello <b>world</b></p>')
    await fireEvent.input(ed)
    expect(onChange).toHaveBeenCalledOnce()
    ed.innerHTML = '<br>'
    await fireEvent.input(ed)
    expect(onChange).toHaveBeenLastCalledWith('')
  })

  it('does not overwrite the editor with a new value while it is focused', async () => {
    commands()
    const { container, rerender } = render(RichTextEditor, { props: { value: '<p>a</p>' } })
    const ed = editorOf(container)
    await fireEvent.focus(ed)
    await rerender({ value: '<p>b</p>' })
    flushSync()
    expect(ed.innerHTML).toBe('<p>a</p>')
    await fireEvent.blur(ed)
    await rerender({ value: '<p>c</p>' })
    flushSync()
    expect(ed.innerHTML).toBe('<p>c</p>')
  })

  it('toolbar buttons and shortcuts run their commands; headings toggle back to paragraphs', async () => {
    const calls = commands()
    const { container, getByLabelText, getByRole } = render(RichTextEditor, {})
    await fireEvent.click(getByLabelText('Bold'))
    await fireEvent.click(getByLabelText('Strikethrough'))
    await fireEvent.click(getByLabelText('Blockquote'))
    await fireEvent.keyDown(editorOf(container), { key: 'i', ctrlKey: true })
    await fireEvent.click(getByLabelText('Heading'))
    expect(container.querySelector('.ui-rich-text-editor__heading-menu')!.hasAttribute('data-open')).toBe(true)
    await fireEvent.click(getByRole('menuitem', { name: 'H2' }))
    expect(container.querySelector('.ui-rich-text-editor__heading-menu')!.hasAttribute('data-open')).toBe(false)
    vi.mocked(document.queryCommandValue).mockReturnValue('H2')
    await fireEvent.click(getByLabelText('Heading'))
    await fireEvent.click(getByRole('menuitem', { name: 'H2' }))
    expect(calls).toEqual([['bold', undefined], ['strikeThrough', undefined], ['formatBlock', 'blockquote'], ['italic', undefined], ['formatBlock', 'h2'], ['formatBlock', 'p']])
  })

  it('does nothing when disabled or read-only; the heading menu closes on an outside mousedown', async () => {
    const calls = commands()
    const { container, getByLabelText } = render(RichTextEditor, { props: { readOnly: true } })
    expect(getByLabelText('Bold').hasAttribute('disabled')).toBe(true)
    expect(editorOf(container).getAttribute('contenteditable')).toBe('false')
    await fireEvent.keyDown(editorOf(container), { key: 'b', ctrlKey: true })
    expect(calls).toEqual([])
    const b = render(RichTextEditor, {})
    await fireEvent.click(within(b.container).getByLabelText('Heading'))
    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    flushSync()
    expect(b.container.querySelector('.ui-rich-text-editor__heading-menu')!.hasAttribute('data-open')).toBe(false)
  })
})
