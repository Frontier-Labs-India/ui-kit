import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/svelte'
import Alert from '../../src/components/Alert.svelte'
import FilterPill from '../../src/components/FilterPill.svelte'
import FilterPillGroup from '../../src/components/FilterPillGroup.svelte'

describe('Alert', () => {
  it('fires onDismiss and the action', async () => {
    const onDismiss = vi.fn(), onClick = vi.fn()
    render(Alert, { props: { variant: 'info', dismissible: true, onDismiss, action: { label: 'Retry', onClick } } })
    await fireEvent.click(screen.getByLabelText('Dismiss'))
    await fireEvent.click(screen.getByText('Retry'))
    expect([onDismiss.mock.calls.length, onClick.mock.calls.length]).toEqual([1, 1])
  })
})

describe('FilterPill', () => {
  it('remove does not also fire the pill click', async () => {
    const onclick = vi.fn(), onRemove = vi.fn()
    const { container } = render(FilterPill, { props: { label: 'Region', onclick, onRemove } })
    await fireEvent.click(screen.getByLabelText('Remove Region'))
    expect(onRemove).toHaveBeenCalledOnce()
    expect(onclick).not.toHaveBeenCalled()
    await fireEvent.click(container.querySelector('.ui-filter-pill__main')!)
    expect(onclick).toHaveBeenCalledOnce()
  })

  it('never nests a button inside a button', () => {
    const { container } = render(FilterPill, { props: { label: 'Region', onRemove: () => {} } })
    expect(container.querySelector('button button')).toBeNull()
  })
})

describe('FilterPillGroup', () => {
  it('shows Clear all only with a handler, and fires it', async () => {
    const onClearAll = vi.fn()
    const { container } = render(FilterPillGroup, { props: {} })
    expect(container.querySelector('button')).toBeNull()
    render(FilterPillGroup, { props: { onClearAll, clearLabel: 'Reset' } })
    await fireEvent.click(screen.getByText('Reset'))
    expect(onClearAll).toHaveBeenCalledOnce()
  })
})
