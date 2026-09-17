import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/svelte'
import Sidebar from '../../src/components/Sidebar.svelte'
import SidebarItem from '../../src/components/SidebarItem.svelte'
import NotificationStack from '../../src/components/NotificationStack.svelte'

describe('Sidebar', () => {
  it('onCollapse receives the toggled state', async () => {
    const onCollapse = vi.fn()
    render(Sidebar, { props: { collapsed: false, onCollapse } })
    await fireEvent.click(screen.getByLabelText('Collapse sidebar'))
    expect(onCollapse).toHaveBeenCalledWith(true)
  })

  it('SidebarItem is a link with href and a button without, both clickable', async () => {
    const onClick = vi.fn()
    const a = render(SidebarItem, { props: { label: 'Home', href: '/home', onClick } })
    expect(a.container.querySelector('a[href="/home"]')).not.toBeNull()
    const b = render(SidebarItem, { props: { label: 'Settings', onClick } })
    const btn = b.container.querySelector('button[type="button"]')!
    await fireEvent.click(btn)
    expect(onClick).toHaveBeenCalledOnce()
  })
})

describe('NotificationStack', () => {
  const now = Date.now()
  const list = [
    { id: '1', title: 'Deploy done', timestamp: now, action: { label: 'View', onClick: vi.fn() } },
    { id: '2', title: 'Old', timestamp: now, read: true },
  ]

  it('clicking an unread notification marks it read; a read one does not', async () => {
    const onMarkRead = vi.fn()
    const { container } = render(NotificationStack, { props: { notifications: list, onMarkRead } })
    const [unread, read] = container.querySelectorAll('article')
    await fireEvent.click(unread)
    await fireEvent.click(read)
    expect(onMarkRead.mock.calls).toEqual([['1']])
  })

  it('dismiss and action do not also mark read', async () => {
    const onMarkRead = vi.fn(), onDismiss = vi.fn()
    render(NotificationStack, { props: { notifications: list, onMarkRead, onDismiss } })
    await fireEvent.click(screen.getAllByLabelText('Dismiss notification')[0])
    await fireEvent.click(screen.getByText('View'))
    expect(onDismiss).toHaveBeenCalledWith('1')
    expect(list[0].action!.onClick).toHaveBeenCalledOnce()
    expect(onMarkRead).not.toHaveBeenCalled()
  })
})
