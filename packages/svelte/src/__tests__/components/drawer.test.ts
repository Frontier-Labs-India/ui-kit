import { describe, it, expect, vi, afterEach } from 'vitest'
import { render } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import Drawer from '../../components/Drawer.svelte'

afterEach(() => {
  document.body.querySelectorAll('.ui-drawer').forEach(n => n.remove())
})

describe('Drawer', () => {
  it('renders nothing when closed', () => {
    render(Drawer, { props: { open: false, onClose: vi.fn() } })
    expect(document.body.querySelector('.ui-drawer')).toBeNull()
  })

  it('portals to document.body when open', () => {
    const { container } = render(Drawer, { props: { open: true, onClose: vi.fn() } })
    const drawer = document.body.querySelector('.ui-drawer')
    expect(drawer).not.toBeNull()
    expect(container.contains(drawer)).toBe(false)
  })

  it('keeps its scope root class after portalling', () => {
    render(Drawer, { props: { open: true, onClose: vi.fn() } })
    expect(document.body.querySelector('.ui-drawer')!.matches('.ui-drawer')).toBe(true)
  })

  it('keeps the panel resolving to the scope root after portalling', () => {
    render(Drawer, { props: { open: true, onClose: vi.fn() } })
    const panel = document.body.querySelector('.ui-drawer__panel')!
    expect(panel.closest('.ui-drawer')).toBe(document.body.querySelector('.ui-drawer'))
  })

  it('reflects side and size on the panel', () => {
    render(Drawer, { props: { open: true, onClose: vi.fn(), side: 'right', size: 'full' } })
    const panel = document.body.querySelector('.ui-drawer__panel')!
    expect(panel.getAttribute('data-side')).toBe('right')
    expect(panel.getAttribute('data-size')).toBe('full')
  })

  it('renders an overlay by default and omits it when overlay is false', () => {
    render(Drawer, { props: { open: true, onClose: vi.fn() } })
    expect(document.body.querySelector('.ui-drawer__overlay')).not.toBeNull()
    document.body.querySelectorAll('.ui-drawer').forEach(n => n.remove())
    render(Drawer, { props: { open: true, onClose: vi.fn(), overlay: false } })
    expect(document.body.querySelector('.ui-drawer__overlay')).toBeNull()
  })

  it('calls onClose when the overlay is clicked', async () => {
    const onClose = vi.fn()
    render(Drawer, { props: { open: true, onClose } })
    await userEvent.click(document.body.querySelector('.ui-drawer__overlay') as HTMLElement)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose on Escape', async () => {
    const onClose = vi.fn()
    render(Drawer, { props: { open: true, onClose } })
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('does not call onClose on Escape while closed', async () => {
    const onClose = vi.fn()
    render(Drawer, { props: { open: false, onClose } })
    await userEvent.keyboard('{Escape}')
    expect(onClose).not.toHaveBeenCalled()
  })

  it('removes the portalled node from the body when closed again', async () => {
    const { rerender } = render(Drawer, { props: { open: true, onClose: vi.fn() } })
    expect(document.body.querySelector('.ui-drawer')).not.toBeNull()
    await rerender({ open: false, onClose: vi.fn() })
    expect(document.body.querySelector('.ui-drawer')).toBeNull()
  })

  it('removes the portalled node on unmount', () => {
    const { unmount } = render(Drawer, { props: { open: true, onClose: vi.fn() } })
    unmount()
    expect(document.body.querySelector('.ui-drawer')).toBeNull()
  })

  it('removes its Escape listener on unmount', async () => {
    const onClose = vi.fn()
    const { unmount } = render(Drawer, { props: { open: true, onClose } })
    unmount()
    await userEvent.keyboard('{Escape}')
    expect(onClose).not.toHaveBeenCalled()
  })

  it('reflects a motion prop change after mount', async () => {
    const onClose = vi.fn()
    const { rerender } = render(Drawer, { props: { open: true, onClose, motion: 1 } })
    expect(document.body.querySelector('.ui-drawer__panel')!.getAttribute('data-motion')).toBe('1')
    await rerender({ open: true, onClose, motion: 0 })
    expect(document.body.querySelector('.ui-drawer__panel')!.getAttribute('data-motion')).toBe('0')
  })
})
