import { describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { render, fireEvent } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import CodeEditor from '../../src/components/CodeEditor.svelte'
import BindProbe from './value-bind-probe.svelte'
import fixture from '../fixtures/contract.json'

const out = (c: HTMLElement) => JSON.parse(c.querySelector('output')!.textContent!)
const key = (ta: HTMLTextAreaElement, k: string, shiftKey = false) => {
  const e = new KeyboardEvent('keydown', { key: k, shiftKey, bubbles: true, cancelable: true })
  ta.dispatchEvent(e)
  flushSync()
  return e
}

describe('CodeEditor', () => {
  it('lib/code-editor-tokenize.ts is still a verbatim extract of the React source', () => {
    const react = readFileSync(resolve(import.meta.dirname, '../../../../src/domain/code-editor.tsx'), 'utf8')
    const ours = readFileSync(resolve(import.meta.dirname, '../../src/lib/code-editor-tokenize.ts'), 'utf8')
    const lang = react.slice(react.indexOf('export type CodeEditorLanguage'), react.indexOf('export interface CodeEditorProps')).trimEnd()
    const body = react.slice(react.indexOf('interface Token {'), react.indexOf('// ─── Styles')).trimEnd()
      .replace('interface Token {', 'export interface Token {')
      .replace('function tokenizeLine(', 'export function tokenizeLine(')
    expect(ours.endsWith(lang + '\n\n' + body + '\n')).toBe(true)
  })

  it("renders every contract case's highlighted text identically to React, whitespace included", () => {
    const cases = (fixture as unknown as { components: Record<string, Record<string, { props: Record<string, unknown>; html: string }>> }).components.CodeEditor
    expect(Object.keys(cases).length).toBeGreaterThan(3)
    for (const [name, { props, html }] of Object.entries(cases)) {
      const t = document.createElement('template')
      t.innerHTML = html
      const { container, unmount } = render(CodeEditor, { props: props as never })
      expect(container.querySelector('pre')!.innerHTML.replace(/<!---->/g, ''), name).toBe(t.content.querySelector('pre')!.innerHTML)
      unmount()
    }
  })

  it('Tab inserts spaces at the cursor and indents a multi-line selection; Shift+Tab dedents (bind:value)', () => {
    const { container } = render(BindProbe, { props: { field: CodeEditor, initial: 'a\nb', props: { tabSize: 4 } } })
    const ta = container.querySelector('textarea')!
    ta.setSelectionRange(1, 1)
    expect(key(ta, 'Tab').defaultPrevented).toBe(true)
    expect(out(container)).toBe('a    \nb')
    expect(ta.selectionStart).toBe(5)
    ta.setSelectionRange(0, ta.value.length)
    key(ta, 'Tab')
    expect(out(container)).toBe('    a    \n    b')
    ta.setSelectionRange(12, 12)
    key(ta, 'Tab', true)
    expect(out(container)).toBe('    a    \nb')
    expect(ta.selectionStart).toBe(10)
  })

  it('Enter keeps the current line indentation', () => {
    const onChange = vi.fn()
    const { container } = render(CodeEditor, { props: { defaultValue: '  if (x) {', onChange } })
    const ta = container.querySelector('textarea')!
    ta.setSelectionRange(ta.value.length, ta.value.length)
    key(ta, 'Enter')
    expect(onChange).toHaveBeenLastCalledWith('  if (x) {\n  ')
    expect(container.querySelectorAll('.ui-code-editor__line-number')).toHaveLength(2)
  })

  it('tracks the active line from the caret, and syncs the highlight layer scroll', async () => {
    const { container } = render(CodeEditor, { props: { defaultValue: 'one\ntwo\nthree' } })
    const ta = container.querySelector('textarea')!
    ta.setSelectionRange(9, 9)
    await fireEvent.click(ta)
    expect(container.querySelector('.ui-code-editor__line-number[data-active]')!.textContent).toBe('3')
    expect(container.querySelectorAll('.ui-code-editor__line[data-active]')).toHaveLength(1)
    ta.scrollTop = 40
    ta.scrollLeft = 7
    await fireEvent.scroll(ta)
    const pre = container.querySelector('pre')!
    expect([pre.scrollTop, pre.scrollLeft]).toEqual([40, 7])
  })
})
