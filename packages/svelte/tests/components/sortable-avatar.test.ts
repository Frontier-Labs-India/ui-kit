import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import SortableList from '../../src/components/SortableList.svelte'
import AvatarUpload from '../../src/components/AvatarUpload.svelte'

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

const items = [{ id: 'a', content: 'A' }, { id: 'b', content: 'B' }, { id: 'c', content: 'C' }]
const opts = (c: HTMLElement) => Array.from(c.querySelectorAll<HTMLElement>('[role="option"]'))
const key = (el: Element, k: string, init: KeyboardEventInit = {}) => {
  const e = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init })
  el.dispatchEvent(e)
  flushSync()
  return e
}

describe('SortableList', () => {
  it('makes the first option the tab stop; arrows and Home/End move focus; Space grabs and releases', () => {
    const { container } = render(SortableList, { props: { items, onChange: vi.fn() } })
    const [a, b, c] = opts(container)
    expect([a.tabIndex, b.tabIndex, c.tabIndex]).toEqual([0, -1, -1])
    a.focus()
    key(a, 'ArrowDown')
    expect(document.activeElement).toBe(b)
    expect(b.tabIndex).toBe(0)
    key(b, 'End')
    expect(document.activeElement).toBe(c)
    key(c, ' ')
    expect(c.getAttribute('aria-selected')).toBe('true')
    key(c, ' ')
    expect(c.getAttribute('aria-selected')).toBe('false')
    key(c, 'Enter')
    key(c, 'Escape')
    expect(c.hasAttribute('data-grabbed')).toBe(false)
  })

  it('Alt+Arrow moves the focused item and refocuses it next frame', () => {
    const frames: FrameRequestCallback[] = []
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(f => { frames.push(f); return frames.length })
    const onChange = vi.fn()
    const { container } = render(SortableList, { props: { items, onChange } })
    const [a] = opts(container)
    a.focus()
    key(a, 'ArrowDown', { altKey: true })
    expect(onChange.mock.calls[0][0].map((i: { id: string }) => i.id)).toEqual(['b', 'a', 'c'])
    key(a, 'ArrowUp', { altKey: true }) // already first: no move
    expect(onChange).toHaveBeenCalledOnce()
    frames[0](0)
    expect(document.activeElement).toBe(opts(container)[1])
  })

  it('drag and drop reorders using the pointer against option midpoints (downward adjusts by one)', () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      const i = ['a', 'b', 'c'].indexOf(this.dataset.itemId!)
      return { top: i * 40, height: 40, left: 0, width: 100 } as DOMRect
    })
    const onChange = vi.fn()
    const { container } = render(SortableList, { props: { items, onChange } })
    const listbox = container.querySelector('[role="listbox"]')!
    const data = new Map<string, string>()
    const dt = { setData: (t: string, v: string) => data.set(t, v), getData: (t: string) => data.get(t) ?? '', effectAllowed: '', dropEffect: '' }
    const drag = (type: string, target: Element, clientY = 0) => {
      const e = new MouseEvent(type, { bubbles: true, cancelable: true, clientY }) as DragEvent
      Object.defineProperty(e, 'dataTransfer', { value: dt })
      target.dispatchEvent(e)
      flushSync()
      return e
    }
    drag('dragstart', opts(container)[0])
    drag('dragover', listbox, 110) // below c's midpoint (100) → end
    expect(container.querySelectorAll('.ui-sortable-list__drop-indicator')).toHaveLength(1)
    expect(listbox.lastElementChild!.classList.contains('ui-sortable-list__drop-indicator')).toBe(true)
    // Between b (mid 60) and c (mid 100): drop index 2, which is 1 once a is removed.
    drag('drop', listbox, 70)
    expect(onChange.mock.calls[0][0].map((i: { id: string }) => i.id)).toEqual(['b', 'a', 'c'])
    expect(container.querySelector('.ui-sortable-list__drop-indicator')).toBeNull()
  })

  it('disabled ignores keys and is not draggable', () => {
    const onChange = vi.fn()
    const { container } = render(SortableList, { props: { items, onChange, disabled: true } })
    const [a] = opts(container)
    expect(a.getAttribute('draggable')).toBe('false')
    a.focus()
    key(a, 'ArrowDown', { altKey: true })
    expect(onChange).not.toHaveBeenCalled()
  })
})

describe('AvatarUpload', () => {
  it('previews a picked file, rejects oversize files, and removes with URL revocation', async () => {
    const revoke = vi.fn()
    let n = 0
    vi.stubGlobal('URL', { createObjectURL: () => `blob:${++n}`, revokeObjectURL: revoke })
    const onChange = vi.fn()
    const onRemove = vi.fn()
    const { container } = render(AvatarUpload, { props: { onChange, onRemove, maxSize: 1024 * 1024 } })
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!
    const pick = async (file: File) => {
      Object.defineProperty(input, 'files', { value: [file], configurable: true })
      await fireEvent.change(input)
    }
    await pick(new File([new Uint8Array(2 * 1024 * 1024)], 'big.png'))
    expect(container.querySelector('[role="alert"]')!.textContent).toBe('File too large. Max size: 1.0MB')
    expect(onChange).not.toHaveBeenCalled()
    const small = new File(['x'], 'a.png')
    await pick(small)
    expect(onChange).toHaveBeenCalledWith(small, 'blob:1')
    expect(container.querySelector('img')!.getAttribute('src')).toBe('blob:1')
    expect(container.querySelector('[role="alert"]')).toBeNull()
    await pick(new File(['y'], 'b.png'))
    expect(revoke).toHaveBeenCalledWith('blob:1')
    await fireEvent.click(container.querySelector('.ui-avatar-upload__remove')!)
    expect(revoke).toHaveBeenCalledWith('blob:2')
    expect(onRemove).toHaveBeenCalledOnce()
    expect(container.querySelector('img')).toBeNull()
  })

  it('accepts a dropped file and marks drag-over; ignores drops when disabled', async () => {
    vi.stubGlobal('URL', { createObjectURL: () => 'blob:d', revokeObjectURL: vi.fn() })
    const onChange = vi.fn()
    const { container } = render(AvatarUpload, { props: { onChange } })
    const label = container.querySelector('label')!
    await fireEvent.dragOver(label)
    expect(label.getAttribute('data-drag-over')).toBe('true')
    const drop = new MouseEvent('drop', { bubbles: true, cancelable: true }) as DragEvent
    Object.defineProperty(drop, 'dataTransfer', { value: { files: [new File(['z'], 'z.png')] } })
    label.dispatchEvent(drop)
    flushSync()
    expect(onChange).toHaveBeenCalledOnce()
    expect(label.hasAttribute('data-drag-over')).toBe(false)

    const d = render(AvatarUpload, { props: { onChange, disabled: true } })
    d.container.querySelector('label')!.dispatchEvent(drop)
    expect(onChange).toHaveBeenCalledOnce()
  })
})
