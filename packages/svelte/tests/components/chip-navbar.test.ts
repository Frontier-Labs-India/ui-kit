import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/svelte'
import { createRawSnippet, flushSync } from 'svelte'
import Chip from '../../src/components/Chip.svelte'
import Navbar from '../../src/components/Navbar.svelte'

const children = createRawSnippet(() => ({ render: () => '<b>Tag</b>' }))
const input = (c: Element) => c.querySelector('input') as HTMLInputElement

describe('Chip', () => {
  it('uncontrolled: toggles and reports', async () => {
    const onChange = vi.fn()
    const { container } = render(Chip, { props: { children, onChange } })
    await fireEvent.click(input(container)); flushSync()
    expect(container.querySelector('label')!.hasAttribute('data-checked')).toBe(true)
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('controlled: a parent that ignores the change keeps the chip where it was', async () => {
    const onChange = vi.fn()
    const { container } = render(Chip, { props: { children, checked: false, onChange } })
    await fireEvent.click(input(container)); flushSync()
    expect(onChange).toHaveBeenCalledWith(true)
    expect(input(container).checked).toBe(false)
    expect(container.querySelector('label')!.hasAttribute('data-checked')).toBe(false)
  })

  it('controlled: a parent that updates the prop moves the chip', async () => {
    const { container, rerender } = render(Chip, { props: { children, checked: false } })
    await rerender({ children, checked: true }); flushSync()
    expect(input(container).checked).toBe(true)
  })

  it('the icon hides once checked', async () => {
    const { container } = render(Chip, { props: { children, icon: 'i' } })
    expect(container.querySelector('.ui-chip__icon')).not.toBeNull()
    await fireEvent.click(input(container)); flushSync()
    expect(container.querySelector('.ui-chip__icon')).toBeNull()
  })
})

describe('Navbar', () => {
  it('the hamburger toggles the mobile menu', async () => {
    const nav = createRawSnippet(() => ({ render: () => '<a href="#a">A</a>' }))
    const { container } = render(Navbar, { props: { children: nav } })
    const btn = screen.getByLabelText('Toggle menu')
    await fireEvent.click(btn); flushSync()
    expect(container.querySelector('header')!.getAttribute('data-mobile-open')).toBe('true')
    expect(btn.getAttribute('aria-expanded')).toBe('true')
  })
})
