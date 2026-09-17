import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/svelte'
import Pagination from '../../src/components/Pagination.svelte'
import Stepper from '../../src/components/Stepper.svelte'

describe('Pagination', () => {
  it('navigates by page, prev, next, first and last', async () => {
    const onChange = vi.fn()
    render(Pagination, { props: { page: 5, totalPages: 10, onChange, showFirst: true } })
    for (const label of ['Page 6', 'Previous page', 'Next page', 'First page', 'Last page']) {
      await fireEvent.click(screen.getByLabelText(label))
    }
    expect(onChange.mock.calls.map(c => c[0])).toEqual([6, 4, 6, 1, 10])
  })

  it('the current page does nothing when clicked', async () => {
    const onChange = vi.fn()
    render(Pagination, { props: { page: 3, totalPages: 5, onChange } })
    await fireEvent.click(screen.getByLabelText('Page 3'))
    expect(onChange).not.toHaveBeenCalled()
  })
})

describe('Stepper', () => {
  const steps = [{ id: 'a', label: 'One' }, { id: 'b', label: 'Two' }]

  it('clicks and Enter/Space select a step when clickable', async () => {
    const onStepClick = vi.fn()
    const { container } = render(Stepper, { props: { steps, activeStep: 0, onStepClick } })
    const [a, b] = container.querySelectorAll('.ui-stepper__step')
    await fireEvent.click(b)
    await fireEvent.keyDown(a, { key: 'Enter' })
    await fireEvent.keyDown(b, { key: ' ' })
    await fireEvent.keyDown(b, { key: 'x' })
    expect(onStepClick.mock.calls.map(c => c[0])).toEqual([1, 0, 1])
  })

  it('is not focusable or clickable without a handler', () => {
    const { container } = render(Stepper, { props: { steps, activeStep: 0 } })
    expect(container.querySelector('[tabindex]')).toBeNull()
    expect(container.querySelector('[role="button"]')).toBeNull()
  })
})
