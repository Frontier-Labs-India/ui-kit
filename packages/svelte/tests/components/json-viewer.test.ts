import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import JsonViewer from '../../src/components/JsonViewer.svelte'

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers() })

describe('JsonViewer', () => {
  it('marks circular references instead of recursing forever', () => {
    const data: Record<string, unknown> = { a: 1 }
    data.self = data
    const { container } = render(JsonViewer, { props: { data } })
    expect(container.textContent).toContain('[Circular]')
  })

  it('collapses and expands a node', async () => {
    const { container } = render(JsonViewer, { props: { data: { a: { b: 1 } } } })
    const rootToggle = screen.getAllByLabelText('Collapse')[0]
    await fireEvent.click(rootToggle); flushSync()
    expect(container.querySelector('.ui-json-viewer__children')!.hasAttribute('data-collapsed')).toBe(true)
    await fireEvent.click(screen.getAllByLabelText('Expand')[0]); flushSync()
    expect(container.querySelector('.ui-json-viewer__children')!.hasAttribute('data-collapsed')).toBe(false)
  })

  it('show more reveals a truncated string', async () => {
    const { container } = render(JsonViewer, { props: { data: { s: 'abcdefgh' }, maxStringLength: 3 } })
    const value = () => container.querySelector('[data-type="string"]')!.textContent
    expect(value()).toBe('"abc..."')
    await fireEvent.click(screen.getByLabelText('Expand string')); flushSync()
    expect(value()).toBe('"abcdefgh"')
  })

  it('copies a value with clipboard enabled and marks it briefly', async () => {
    const writeText = vi.fn()
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    vi.useFakeTimers({ toFake: ['setTimeout'] })
    const { container } = render(JsonViewer, { props: { data: { n: 42 }, enableClipboard: true } })
    await fireEvent.click(screen.getByLabelText('Copy value 42')); flushSync()
    expect(writeText).toHaveBeenCalledWith('42')
    expect(container.querySelector('[data-copied]')).not.toBeNull()
    vi.advanceTimersByTime(1500); flushSync()
    expect(container.querySelector('[data-copied]')).toBeNull()
  })

  it("theme 'auto' does not throw where matchMedia is missing", () => {
    const { container } = render(JsonViewer, { props: { data: 1, theme: 'auto' } })
    expect(container.querySelector('.ui-json-viewer')!.getAttribute('data-theme')).toBe('dark')
  })
})
