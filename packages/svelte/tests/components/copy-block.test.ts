import { describe, it, expect, vi, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { render, fireEvent, screen } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import CopyBlock from '../../src/components/CopyBlock.svelte'
import fixture from '../fixtures/contract.json'

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers() })

describe('CopyBlock', () => {
  it('lib/tokenize.ts is still a verbatim extract of the React source', () => {
    const react = readFileSync(resolve(import.meta.dirname, '../../../../src/domain/copy-block.tsx'), 'utf8')
    const ours = readFileSync(resolve(import.meta.dirname, '../../src/lib/tokenize.ts'), 'utf8')
    const lang = react.slice(react.indexOf('export type CopyBlockLanguage'), react.indexOf('export interface CopyBlockProps')).trimEnd()
    const body = react.slice(react.indexOf('interface Token {'), react.indexOf('const copyBlockStyles')).trimEnd()
      .replace('interface Token {', 'export interface Token {')
      .replace('function tokenizeLine(', 'export function tokenizeLine(')
    expect(ours.endsWith(lang + '\n\n' + body + '\n')).toBe(true)
  })

  it("renders every contract case's code text identically to React, whitespace included", () => {
    const cases = (fixture as unknown as { components: Record<string, Record<string, { props: Record<string, unknown>; html: string }>> }).components.CopyBlock
    expect(Object.keys(cases).length).toBeGreaterThan(0)
    for (const [name, { props, html }] of Object.entries(cases)) {
      const t = document.createElement('template')
      t.innerHTML = html
      const expected = t.content.querySelector('pre')!.textContent
      const { container, unmount } = render(CopyBlock, { props: props as never })
      expect(container.querySelector('pre')!.textContent, name).toBe(expected)
      unmount()
    }
  })

  it('copies the code and shows Copied! for 2s', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    vi.useFakeTimers({ toFake: ['setTimeout'] })
    render(CopyBlock, { props: { code: 'npm i' } })
    await fireEvent.click(screen.getByLabelText('Copy code'))
    await Promise.resolve(); flushSync()
    expect(writeText).toHaveBeenCalledWith('npm i')
    expect(screen.getByLabelText('Copy code').textContent).toBe('Copied!')
    vi.advanceTimersByTime(2000); flushSync()
    expect(screen.getByLabelText('Copy code').textContent).toBe('Copy')
  })
})
