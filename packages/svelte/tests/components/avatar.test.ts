import { describe, it, expect } from 'vitest'
import { render, fireEvent } from '@testing-library/svelte'
import Avatar from '../../src/components/Avatar.svelte'
import Probe from './avatar-probe.svelte'

const initials = (c: HTMLElement) => [...c.querySelectorAll('.ui-avatar__initials')].map(e => e.textContent)

describe('Avatar', () => {
  it('falls back to initials when the image fails, and names itself from alt then', async () => {
    const { container } = render(Avatar, { props: { src: '/broken.png', alt: 'Ada', name: 'Ada Lovelace' } })
    const root = container.querySelector('.ui-avatar')!
    expect(root.hasAttribute('role')).toBe(false)
    await fireEvent.error(container.querySelector('img')!)
    expect(container.querySelector('img')).toBeNull()
    expect(initials(container)).toEqual(['AL'])
    expect(root.getAttribute('role')).toBe('img')
    expect(root.getAttribute('aria-label')).toBe('Ada')
  })
})

describe('AvatarGroup', () => {
  it('follows avatars being added and removed, and a max change', async () => {
    const { container, rerender } = render(Probe, { props: { names: ['A B', 'C D'] } })
    expect(initials(container)).toEqual(['CD', 'AB'])
    await rerender({ names: ['A B', 'C D', 'E F'] })
    expect(initials(container)).toEqual(['EF', 'CD', 'AB'])
    await rerender({ names: ['A B', 'E F'] })
    expect(initials(container)).toEqual(['EF', 'AB'])
    await rerender({ names: ['A B', 'E F'], max: 1 })
    expect(initials(container)).toEqual(['AB'])
    expect(container.querySelector('.ui-avatar-group__overflow')!.textContent).toBe('+1')
  })

  it('binds a registered avatar\'s ref to the element the group renders for it', () => {
    const { container, component } = render(Probe, { props: { names: ['A B', 'C D'] } })
    const rendered = [...container.querySelectorAll('.ui-avatar')].find(e => e.textContent === 'AB')
    expect(component.getFirstRef()).toBe(rendered)
  })
})
