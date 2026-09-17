import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import FileUpload from '../../src/components/FileUpload.svelte'

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

const png = (name: string, bytes = 10) => new File([new Uint8Array(bytes)], name, { type: 'image/png' })
const pdf = (name: string, bytes = 10) => new File([new Uint8Array(bytes)], name, { type: 'application/pdf' })

function setup(props: Record<string, unknown>) {
  const revoke = vi.fn()
  let n = 0
  vi.stubGlobal('URL', { createObjectURL: () => `blob:${++n}`, revokeObjectURL: revoke })
  const r = render(FileUpload, { props: { name: 'f', ...props } })
  const input = r.container.querySelector<HTMLInputElement>('input[type="file"]')!
  const pick = async (files: File[]) => {
    Object.defineProperty(input, 'files', { value: files, configurable: true })
    await fireEvent.change(input)
  }
  return { ...r, input, pick, revoke }
}

describe('FileUpload', () => {
  it('lists picked files with image previews and sizes; remove revokes the preview', async () => {
    const onChange = vi.fn()
    const { container, pick, revoke } = setup({ onChange, multiple: true })
    await pick([png('a.png', 2048), pdf('b.pdf', 3 * 1024 * 1024)])
    expect(onChange).toHaveBeenCalledOnce()
    expect(container.querySelector('img')!.getAttribute('src')).toBe('blob:1')
    expect(Array.from(container.querySelectorAll('.ui-file-upload__file-size')).map(s => s.textContent)).toEqual(['2 KB', '3.0 MB'])
    await fireEvent.click(container.querySelector('[aria-label="Remove a.png"]')!)
    expect(onChange).toHaveBeenLastCalledWith([expect.objectContaining({ name: 'b.pdf' })])
    expect(revoke).toHaveBeenCalledWith('blob:1')
  })

  it('rejects a batch with a wrong type or oversize file, reporting why', async () => {
    const onChange = vi.fn()
    const onError = vi.fn()
    const { pick } = setup({ onChange, onError, accept: '.pdf,image/*', maxSize: 100 })
    await pick([png('ok.png'), new File(['x'], 'notes.txt', { type: 'text/plain' })])
    expect(onError).toHaveBeenLastCalledWith('File type not accepted: notes.txt')
    await pick([pdf('huge.pdf', 2048)])
    expect(onError).toHaveBeenLastCalledWith('File too large: huge.pdf (2 KB)')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('maxFiles keeps what fits, then refuses when full', async () => {
    const onChange = vi.fn()
    const onError = vi.fn()
    const { pick } = setup({ onChange, onError, maxFiles: 2, multiple: true })
    await pick([pdf('1.pdf'), pdf('2.pdf'), pdf('3.pdf')])
    expect(onChange.mock.calls[0][0].map((f: File) => f.name)).toEqual(['1.pdf', '2.pdf'])
    await pick([pdf('4.pdf')])
    expect(onError).toHaveBeenCalledWith('Maximum 2 files already selected')
  })

  it('the dropzone opens the picker by click or key, accepts drops, and shows drag-over; not when disabled', async () => {
    const { container, input } = setup({})
    const click = vi.spyOn(input, 'click').mockImplementation(() => {})
    const zone = container.querySelector('[role="button"]')!
    await fireEvent.click(zone)
    await fireEvent.keyDown(zone, { key: 'Enter' })
    expect(click).toHaveBeenCalledTimes(2)
    await fireEvent.dragEnter(zone)
    expect(container.querySelector('.ui-file-upload')!.hasAttribute('data-dragover')).toBe(true)
    const drop = new MouseEvent('drop', { bubbles: true, cancelable: true }) as DragEvent
    Object.defineProperty(drop, 'dataTransfer', { value: { files: [pdf('d.pdf')] } })
    zone.dispatchEvent(drop)
    flushSync()
    expect(container.querySelector('.ui-file-upload__file-name')!.textContent).toBe('d.pdf')
    expect(container.querySelector('.ui-file-upload')!.hasAttribute('data-dragover')).toBe(false)

    const d = setup({ disabled: true })
    const dClick = vi.spyOn(d.input, 'click').mockImplementation(() => {})
    await fireEvent.click(d.container.querySelector('[role="button"]')!)
    expect(dClick).not.toHaveBeenCalled()
  })

  it('revokes every preview URL on destroy', async () => {
    const { pick, unmount, revoke } = setup({ multiple: true })
    await pick([png('a.png'), png('b.png')])
    unmount()
    expect(revoke.mock.calls.map(c => c[0]).sort()).toEqual(['blob:1', 'blob:2'])
  })
})
