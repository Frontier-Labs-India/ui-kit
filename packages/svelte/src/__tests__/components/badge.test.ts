import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import Badge from '../../components/Badge.svelte'

describe('Badge', () => {
  it('renders a ui-badge root span', () => {
    const { container } = render(Badge)
    const el = container.querySelector('.ui-badge')
    expect(el).not.toBeNull()
    expect(el!.tagName).toBe('SPAN')
  })

  it('defaults to variant=default size=md, matching the React defaults', () => {
    const { container } = render(Badge)
    const el = container.querySelector('.ui-badge')!
    expect(el.getAttribute('data-variant')).toBe('default')
    expect(el.getAttribute('data-size')).toBe('md')
  })

  it('reflects variant and size as data attributes', () => {
    const { container } = render(Badge, { props: { variant: 'danger', size: 'xl' } })
    const el = container.querySelector('.ui-badge')!
    expect(el.getAttribute('data-variant')).toBe('danger')
    expect(el.getAttribute('data-size')).toBe('xl')
  })

  it('renders no dot by default', () => {
    const { container } = render(Badge, { props: { dot: false } })
    expect(container.querySelector('.ui-badge__dot')).toBeNull()
  })

  it('renders a dot when dot is set', () => {
    const { container } = render(Badge, { props: { dot: true } })
    expect(container.querySelector('.ui-badge__dot')).not.toBeNull()
  })

  it('clamps count at maxCount with a + suffix', () => {
    const { container } = render(Badge, { props: { count: 150, maxCount: 99 } })
    expect(container.querySelector('.ui-badge')!.textContent!.trim()).toBe('99+')
  })

  it('shows the exact count when under maxCount', () => {
    const { container } = render(Badge, { props: { count: 7, maxCount: 99 } })
    expect(container.querySelector('.ui-badge')!.textContent!.trim()).toBe('7')
  })

  it('shows a count of 0 rather than falling through to children', () => {
    const { container } = render(Badge, { props: { count: 0 } })
    expect(container.querySelector('.ui-badge')!.textContent!.trim()).toBe('0')
  })

  it('calls onRemove when the remove button is clicked', async () => {
    const onRemove = vi.fn()
    render(Badge, { props: { removable: true, onRemove } })
    await userEvent.click(screen.getByLabelText('Remove'))
    expect(onRemove).toHaveBeenCalledOnce()
  })

  it('omits data-outline when outline is false, matching React', () => {
    const { container } = render(Badge, { props: { outline: false } })
    expect(container.querySelector('.ui-badge')!.hasAttribute('data-outline')).toBe(false)
  })

  it('sets data-outline when outline is true', () => {
    const { container } = render(Badge, { props: { outline: true } })
    expect(container.querySelector('.ui-badge')!.getAttribute('data-outline')).toBe('true')
  })

  it('forwards unknown attributes to the root', () => {
    const { container } = render(Badge, { props: { id: 'b1', title: 'hi' } })
    const el = container.querySelector('.ui-badge')!
    expect(el.getAttribute('id')).toBe('b1')
    expect(el.getAttribute('title')).toBe('hi')
  })

  it('carries no style attribute — CSP forbids one', () => {
    const { container } = render(Badge, { props: { variant: 'primary', dot: true, pulse: true } })
    expect(container.querySelector('[style]')).toBeNull()
  })
})
