import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import Accordion from '../../components/Accordion.svelte'

const items = [
  { id: 'a', trigger: 'First', content: 'Body A' },
  { id: 'b', trigger: 'Second', content: 'Body B' },
]

const openStates = (c: Element) => [...c.querySelectorAll('details')].map(d => (d as HTMLDetailsElement).open)

describe('Accordion', () => {
  it('renders a details/summary per item', () => {
    const { container } = render(Accordion, { props: { items } })
    expect(container.querySelectorAll('details')).toHaveLength(2)
    expect(screen.getByText('First')).toBeTruthy()
    expect(screen.getByText('Second')).toBeTruthy()
  })

  it('starts with everything closed by default', () => {
    const { container } = render(Accordion, { props: { items } })
    expect(openStates(container)).toEqual([false, false])
  })

  it('starts with defaultOpen expanded', () => {
    const { container } = render(Accordion, { props: { items, defaultOpen: ['a'] } })
    expect(openStates(container)).toEqual([true, false])
  })

  it('opens an item on click', async () => {
    const { container } = render(Accordion, { props: { items } })
    await userEvent.click(screen.getByText('First'))
    expect(openStates(container)).toEqual([true, false])
  })

  it('closes an open item on click', async () => {
    const { container } = render(Accordion, { props: { items, defaultOpen: ['a'] } })
    await userEvent.click(screen.getByText('First'))
    expect(openStates(container)).toEqual([false, false])
  })

  it('type=single closes the previous item when another opens', async () => {
    const { container } = render(Accordion, { props: { items, type: 'single', defaultOpen: ['a'] } })
    await userEvent.click(screen.getByText('Second'))
    expect(openStates(container)).toEqual([false, true])
  })

  it('type=multiple keeps both open', async () => {
    const { container } = render(Accordion, { props: { items, type: 'multiple', defaultOpen: ['a'] } })
    await userEvent.click(screen.getByText('Second'))
    expect(openStates(container)).toEqual([true, true])
  })

  it('does not toggle a disabled item', async () => {
    const withDisabled = [{ id: 'a', trigger: 'First', content: 'A', disabled: true }]
    const { container } = render(Accordion, { props: { items: withDisabled } })
    await userEvent.click(screen.getByText('First'))
    expect(openStates(container)).toEqual([false])
  })

  it('marks a disabled item aria-disabled', () => {
    const withDisabled = [{ id: 'a', trigger: 'First', content: 'A', disabled: true }]
    const { container } = render(Accordion, { props: { items: withDisabled } })
    expect(container.querySelector('summary')!.getAttribute('aria-disabled')).toBe('true')
  })

  it('fires onOpenChange with the new set', async () => {
    const onOpenChange = vi.fn()
    render(Accordion, { props: { items, type: 'multiple', defaultOpen: ['a'], onOpenChange } })
    await userEvent.click(screen.getByText('Second'))
    expect(onOpenChange).toHaveBeenCalledWith(['a', 'b'])
  })

  it("does not mutate the caller's defaultOpen array", async () => {
    const defaultOpen = ['a']
    render(Accordion, { props: { items, type: 'multiple', defaultOpen } })
    await userEvent.click(screen.getByText('Second'))
    expect(defaultOpen).toEqual(['a'])
  })

  it('reflects a motion prop change after mount', async () => {
    const { container, rerender } = render(Accordion, { props: { items, motion: 1 } })
    expect(container.querySelector('.ui-accordion')!.getAttribute('data-motion')).toBe('1')
    await rerender({ items, motion: 0 })
    expect(container.querySelector('.ui-accordion')!.getAttribute('data-motion')).toBe('0')
  })

  it('carries no style attribute — CSP forbids one', () => {
    const { container } = render(Accordion, { props: { items, defaultOpen: ['a'] } })
    expect(container.querySelector('[style]')).toBeNull()
  })
})
