import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/svelte'
import { createRawSnippet, flushSync } from 'svelte'
import Chip from '../../src/components/Chip.svelte'
import Navbar from '../../src/components/Navbar.svelte'
import ChipBindProbe from './chip-bind-probe.svelte'

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

  it('bind:checked round-trips to the parent and still calls onChange', async () => {
    const { container } = render(ChipBindProbe)
    await fireEvent.click(input(container)); flushSync()
    expect(container.querySelector('output')!.textContent).toBe('true')
    expect(container.querySelector('label')!.hasAttribute('data-checked')).toBe(true)
    expect(container.querySelector('output')!.getAttribute('data-calls')).toBe('1')
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
