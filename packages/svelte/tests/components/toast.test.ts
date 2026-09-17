import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import Probe from './toast-probe.svelte'
import Consumer from './toast-consumer.svelte'
import type { ToastApi } from '../../src/lib/toast-context.js'

afterEach(() => { vi.useRealTimers() })

function setup(maxVisible?: number) {
  let api!: ToastApi
  const r = render(Probe, { props: { onApi: a => { api = a }, ...(maxVisible ? { maxVisible } : {}) } })
  const act = <T>(fn: () => T): T => { const out = fn(); flushSync(); return out }
  return { ...r, api: () => api, act, toasts: () => [...r.container.querySelectorAll<HTMLElement>('.ui-toast')] }
}

describe('ToastProvider', () => {
  it('renders a toast\'s parts: role, live level, variant icon, title, description, action, close, progress', async () => {
    const onClick = vi.fn()
    const { api, act, toasts } = setup()
    act(() => api().toast({ title: 'Saved', description: 'All good', variant: 'error', action: { label: 'Undo', onClick }, duration: 3000 }))
    const [t] = toasts()
    expect(t.getAttribute('role')).toBe('status')
    expect(t.getAttribute('aria-live')).toBe('assertive')
    expect(t.dataset.variant).toBe('error')
    expect(t.querySelector('.ui-toast__icon svg path')!.getAttribute('d')).toBe('M6 6l4 4M10 6l-4 4')
    expect(t.querySelector('.ui-toast__title')!.textContent).toBe('Saved')
    expect(t.querySelector('.ui-toast__description')!.textContent).toBe('All good')
    await fireEvent.click(t.querySelector('.ui-toast__action')!)
    expect(onClick).toHaveBeenCalledOnce()
    expect(t.querySelector('.ui-toast__close')!.getAttribute('aria-label')).toBe('Dismiss')
    expect((t.querySelector('.ui-toast__progress') as HTMLElement).style.animationDuration).toBe('3000ms')
  })

  it('a default toast has no icon; dismissible false has no close; duration 0 has no progress and stays', async () => {
    vi.useFakeTimers()
    const { api, act, toasts } = setup()
    act(() => api().toast({ title: 'Plain', dismissible: false, duration: 0 }))
    const [t] = toasts()
    expect(t.querySelector('.ui-toast__icon')).toBeNull()
    expect(t.querySelector('.ui-toast__close')).toBeNull()
    expect(t.querySelector('.ui-toast__progress')).toBeNull()
    await vi.advanceTimersByTimeAsync(60_000)
    expect(toasts()).toHaveLength(1)
  })

  it('dismisses after its duration, pausing while hovered', async () => {
    vi.useFakeTimers()
    const { api, act, toasts } = setup()
    act(() => api().toast({ title: 'T', duration: 1000 }))
    await vi.advanceTimersByTimeAsync(600)
    await fireEvent.mouseEnter(toasts()[0])
    await vi.advanceTimersByTimeAsync(5000)
    expect(toasts()).toHaveLength(1)
    await fireEvent.mouseLeave(toasts()[0])
    await vi.advanceTimersByTimeAsync(399)
    expect(toasts()).toHaveLength(1)
    await vi.advanceTimersByTimeAsync(1)
    expect(toasts()).toHaveLength(0)
  })

  it('returns ids, replaces a toast with the same id, caps visible toasts, dismisses one or all', async () => {
    const { api, act, toasts } = setup(2)
    const first = act(() => api().toast({ title: 'one' }))
    expect(first).toMatch(/^toast-\d+$/)
    act(() => api().toast({ title: 'two', id: 'x' }))
    act(() => api().toast({ title: 'three' }))
    expect(toasts().map(t => t.querySelector('.ui-toast__title')!.textContent)).toEqual(['one', 'two'])
    act(() => api().toast({ title: 'two again', id: 'x' }))
    expect(toasts().map(t => t.querySelector('.ui-toast__title')!.textContent)).toEqual(['one', 'three'])
    act(() => api().dismiss(first))
    expect(toasts().map(t => t.querySelector('.ui-toast__title')!.textContent)).toEqual(['three', 'two again'])
    await fireEvent.click(toasts()[0].querySelector('.ui-toast__close')!)
    expect(toasts()).toHaveLength(1)
    act(() => api().dismissAll())
    expect(toasts()).toHaveLength(0)
  })

  it('getToast throws outside a provider, as useToast does', () => {
    expect(() => render(Consumer, { props: { onApi: () => {} } })).toThrow('getToast must be used within a <ToastProvider>')
  })
})
