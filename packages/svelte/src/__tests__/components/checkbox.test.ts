import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import Checkbox from '../../components/Checkbox.svelte'

describe('Checkbox', () => {
  it('renders an input[type=checkbox]', () => {
    const { container } = render(Checkbox, { props: { label: 'Accept' } })
    expect(container.querySelector('input[type="checkbox"]')).not.toBeNull()
  })

  it('associates the label with the input', () => {
    render(Checkbox, { props: { label: 'Accept' } })
    const input = screen.getByLabelText('Accept') as HTMLInputElement
    expect(input.type).toBe('checkbox')
  })

  it('gives each instance a distinct id', () => {
    const a = render(Checkbox, { props: { label: 'A' } })
    const b = render(Checkbox, { props: { label: 'B' } })
    const idA = a.container.querySelector('input')!.id
    const idB = b.container.querySelector('input')!.id
    expect(idA).not.toBe('')
    expect(idA).not.toBe(idB)
  })

  it('honours an explicit id over the generated one', () => {
    const { container } = render(Checkbox, { props: { label: 'A', id: 'my-box' } })
    expect(container.querySelector('input')!.id).toBe('my-box')
  })

  it('toggles on click', async () => {
    render(Checkbox, { props: { label: 'Accept' } })
    const input = screen.getByLabelText('Accept') as HTMLInputElement
    expect(input.checked).toBe(false)
    await userEvent.click(input)
    expect(input.checked).toBe(true)
  })

  it('starts checked when checked is true', () => {
    const { container } = render(Checkbox, { props: { label: 'A', checked: true } })
    expect((container.querySelector('input') as HTMLInputElement).checked).toBe(true)
  })

  it('reflects the indeterminate property, which has no HTML attribute', () => {
    const { container } = render(Checkbox, { props: { label: 'A', indeterminate: true } })
    expect((container.querySelector('input') as HTMLInputElement).indeterminate).toBe(true)
  })

  it('clears indeterminate when the prop goes false', async () => {
    const { container, rerender } = render(Checkbox, { props: { label: 'A', indeterminate: true } })
    await rerender({ label: 'A', indeterminate: false })
    expect((container.querySelector('input') as HTMLInputElement).indeterminate).toBe(false)
  })

  it('sets data-indeterminate on the root', () => {
    const { container } = render(Checkbox, { props: { label: 'A', indeterminate: true } })
    expect(container.querySelector('.ui-checkbox')!.hasAttribute('data-indeterminate')).toBe(true)
  })

  it('does not toggle when disabled', async () => {
    render(Checkbox, { props: { label: 'Accept', disabled: true } })
    const input = screen.getByLabelText('Accept') as HTMLInputElement
    await userEvent.click(input)
    expect(input.checked).toBe(false)
  })

  it('sets data-disabled on the root when disabled', () => {
    const { container } = render(Checkbox, { props: { label: 'A', disabled: true } })
    expect(container.querySelector('.ui-checkbox')!.hasAttribute('data-disabled')).toBe(true)
  })

  it('renders the error message with role=alert and wires aria-describedby', () => {
    const { container } = render(Checkbox, { props: { label: 'A', error: 'Required' } })
    const err = container.querySelector('[role="alert"]')!
    expect(err.textContent).toBe('Required')
    const input = container.querySelector('input')!
    expect(input.getAttribute('aria-describedby')).toBe(err.id)
    expect(input.getAttribute('aria-invalid')).toBe('true')
  })

  it('sets data-error when error is set', () => {
    const { container } = render(Checkbox, { props: { label: 'A', error: 'Required' } })
    expect(container.querySelector('[data-error]')).not.toBeNull()
  })

  it('has no error markup when error is absent', () => {
    const { container } = render(Checkbox, { props: { label: 'A' } })
    expect(container.querySelector('[role="alert"]')).toBeNull()
    expect(container.querySelector('input')!.hasAttribute('aria-invalid')).toBe(false)
  })

  it('reflects a motion prop change after mount', async () => {
    const { container, rerender } = render(Checkbox, { props: { label: 'A', motion: 1 } })
    expect(container.querySelector('.ui-checkbox')!.getAttribute('data-motion')).toBe('1')
    await rerender({ label: 'A', motion: 0 })
    expect(container.querySelector('.ui-checkbox')!.getAttribute('data-motion')).toBe('0')
  })

  it('uses a class for layout, never a style attribute', () => {
    const { container } = render(Checkbox, { props: { label: 'A' } })
    expect(container.querySelector('[style]')).toBeNull()
    expect(container.querySelector('.ui-checkbox__row')).not.toBeNull()
  })
})
