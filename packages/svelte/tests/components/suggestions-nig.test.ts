import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import DataTableSuggestions from '../../src/components/DataTableSuggestions.svelte'
import NetworkInterfaceGrid from '../../src/components/NetworkInterfaceGrid.svelte'

const insight = (id: string, apply = true) => ({ id, type: 't', title: `T${id}`, description: 'd', confidence: 0.5, icon: 'list', ...(apply ? { apply: {} } : {}) })

describe('DataTableSuggestions', () => {
  it('dismissing removes the item and updates the count; the last dismissal hides the panel', async () => {
    const onDismiss = vi.fn()
    const { container } = render(DataTableSuggestions, { props: { insights: [insight('1'), insight('2')], onDismiss } })
    await fireEvent.click(screen.getByLabelText('Dismiss: T1')); flushSync()
    expect(container.querySelector('.ui-data-table-suggestions__badge')!.textContent).toBe('1')
    await fireEvent.click(screen.getByLabelText('Dismiss: T2')); flushSync()
    expect(container.querySelector('.ui-data-table-suggestions')).toBeNull()
    expect(onDismiss.mock.calls).toEqual([['1'], ['2']])
  })

  it('collapses the list and applies an insight', async () => {
    const onApply = vi.fn()
    const insights = [insight('1')]
    const { container } = render(DataTableSuggestions, { props: { insights, onApply } })
    await fireEvent.click(screen.getByLabelText('Apply: T1'))
    expect(onApply).toHaveBeenCalledWith(insights[0])
    await fireEvent.click(container.querySelector('.ui-data-table-suggestions__header')!); flushSync()
    expect(container.querySelector('[role="list"]')).toBeNull()
  })
})

describe('NetworkInterfaceGrid', () => {
  it('reports clicked interfaces', async () => {
    const onInterfaceClick = vi.fn()
    const ifaces = [{ name: 'eth0', status: 'up' as const, speed: '1G', type: 'ethernet' as const }]
    render(NetworkInterfaceGrid, { props: { interfaces: ifaces, onInterfaceClick } })
    await fireEvent.click(screen.getByLabelText('eth0: up, 1G, ethernet'))
    expect(onInterfaceClick).toHaveBeenCalledWith(ifaces[0])
  })
})
