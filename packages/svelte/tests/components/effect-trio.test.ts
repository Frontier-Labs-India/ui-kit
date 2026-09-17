import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import EncryptedText from '../../src/components/EncryptedText.svelte'
import TracingBeam from '../../src/components/TracingBeam.svelte'
import CSVExportButton from '../../src/components/CSVExportButton.svelte'

afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals() })

// A frame queue whose cancel really cancels, as the browser's does.
function frames() {
  const queue = new Map<number, FrameRequestCallback>()
  let id = 0
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation(f => { queue.set(++id, f); return id })
  const cancel = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(h => { queue.delete(h) })
  return {
    run(n: number) {
      for (let i = 0; i < n; i++) {
        const next = queue.entries().next().value
        if (!next) return
        queue.delete(next[0])
        next[1](0)
        flushSync()
      }
    },
    pending: () => queue.size,
    cancel,
  }
}

describe('EncryptedText', () => {
  const state = (c: HTMLElement) => Array.from(c.querySelectorAll<HTMLElement>('.ui-encrypted-text--char')).map(s => (s.hasAttribute('data-resolved') ? 'R' : 'S'))
  const text = (c: HTMLElement) => Array.from(c.querySelectorAll('.ui-encrypted-text--char')).map(s => s.textContent).join('')

  it('scrambles from the scramble set, then resolves one character every round(4/speed) frames', () => {
    const f = frames()
    const { container } = render(EncryptedText, { props: { text: 'ab c', speed: 2, scrambleChars: 'X' } })
    expect(text(container)).toBe('XX X')
    expect(state(container)).toEqual(['S', 'S', 'S', 'S'])
    f.run(2)
    expect(state(container)).toEqual(['R', 'S', 'S', 'S'])
    f.run(6)
    expect(state(container)).toEqual(['R', 'R', 'R', 'R'])
    expect(text(container)).toBe('ab c')
    expect(f.pending()).toBe(0)
  })

  it('is resolved at once at motion 0, and hover waits for the pointer', async () => {
    const f = frames()
    const a = render(EncryptedText, { props: { text: 'hi', motion: 0 } })
    expect(text(a.container)).toBe('hi')
    const onmouseenter = vi.fn()
    const b = render(EncryptedText, { props: { text: 'yo', trigger: 'hover', scrambleChars: 'Z', onmouseenter } })
    f.run(10)
    expect(text(b.container)).toBe('ZZ')
    await fireEvent.mouseEnter(b.container.querySelector('.ui-encrypted-text')!)
    expect(onmouseenter).toHaveBeenCalledOnce()
    f.run(10)
    expect(text(b.container)).toBe('yo')
  })

  it('cancels its frame when destroyed mid-animation', () => {
    const f = frames()
    const { unmount } = render(EncryptedText, { props: { text: 'long text' } })
    f.run(1)
    unmount()
    expect(f.cancel).toHaveBeenCalled()
  })
})

describe('TracingBeam', () => {
  it('sets --beam-progress from scroll position and follows scroll; not at motion 0', () => {
    let top = 400
    vi.stubGlobal('innerHeight', 800)
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({ top, height: 800 }) as DOMRect)
    const { container } = render(TracingBeam, { props: {} })
    const progress = () => container.querySelector<HTMLElement>('.ui-tracing-beam--progress')!.style.getPropertyValue('--beam-progress')
    expect(progress()).toBe('25%') // (800 - 400) / (800 + 800)
    top = -900
    window.dispatchEvent(new Event('scroll'))
    flushSync()
    expect(progress()).toBe('100%')
    top = 900
    window.dispatchEvent(new Event('resize'))
    flushSync()
    expect(progress()).toBe('0%')

    const still = render(TracingBeam, { props: { motion: 0 } })
    expect(still.container.querySelector<HTMLElement>('.ui-tracing-beam--dot')!.style.getPropertyValue('--beam-progress')).toBe('0%')
  })
})

describe('CSVExportButton', () => {
  it('downloads escaped CSV with the given columns and filename, flips exported for 2s, calls onExport then onclick', async () => {
    vi.useFakeTimers()
    let blob: Blob | undefined
    vi.stubGlobal('URL', { createObjectURL: (b: Blob) => { blob = b; return 'blob:x' }, revokeObjectURL: vi.fn() })
    const clicks: HTMLAnchorElement[] = []
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) { clicks.push(this) })
    const order: string[] = []
    const { container } = render(CSVExportButton, {
      props: {
        data: [{ name: 'a,b', note: 'say "hi"' }, { name: 'c', note: null }],
        columns: [{ key: 'name', label: 'Name' }, { key: 'note', label: 'Note' }],
        filename: 'report',
        onExport: () => order.push('export'),
        onclick: () => order.push('click'),
      },
    })
    await fireEvent.click(container.querySelector('button')!)
    expect(await blob!.text()).toBe('Name,Note\n"a,b","say ""hi"""\nc,')
    expect(clicks[0].download).toBe('report.csv')
    expect(order).toEqual(['export', 'click'])
    expect(container.querySelector('button')!.textContent).toContain('Exported!')
    vi.advanceTimersByTime(2000)
    flushSync()
    expect(container.querySelector('button')!.textContent).toContain('Export CSV')
  })

  it('does nothing with no data', async () => {
    const onExport = vi.fn()
    const { container } = render(CSVExportButton, { props: { data: [], onExport } })
    await fireEvent.click(container.querySelector('button')!)
    expect(onExport).not.toHaveBeenCalled()
  })
})
