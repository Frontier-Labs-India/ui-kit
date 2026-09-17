import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import CoreChart from '../../src/components/CoreChart.svelte'
import UptimeTracker from '../../src/components/UptimeTracker.svelte'
import PortStatusGrid from '../../src/components/PortStatusGrid.svelte'

describe('hover tooltips', () => {
  it('CoreChart', async () => {
    const { container } = render(CoreChart, { props: { cores: [{ id: 3, usage: 71 }] } })
    const cell = container.querySelector('.ui-core-chart__cell')!
    await fireEvent.mouseEnter(cell); flushSync()
    expect(container.querySelector('.ui-core-chart__tooltip')!.textContent).toBe('Core 3: 71%')
    await fireEvent.mouseLeave(cell); flushSync()
    expect(container.querySelector('.ui-core-chart__tooltip')).toBeNull()
  })

  it('UptimeTracker shows date, status and uptime', async () => {
    const { container } = render(UptimeTracker, { props: { days: [{ date: '2026-09-01', status: 'degraded', uptime: 0.9876 }] } })
    const day = container.querySelector('.ui-uptime-tracker__day')!
    await fireEvent.mouseEnter(day); flushSync()
    expect(container.querySelector('.ui-uptime-tracker__tooltip')!.textContent).toBe('2026-09-01 — degraded (98.8%)')
  })

  it('PortStatusGrid shows a tooltip only for labelled ports, and reports clicks', async () => {
    const onPortClick = vi.fn()
    const { container } = render(PortStatusGrid, { props: { onPortClick, ports: [{ port: 22, status: 'ok', label: 'ssh' }, { port: 80, status: 'warning' }] } })
    const [a, b] = container.querySelectorAll('.ui-port-status-grid__item')
    await fireEvent.mouseEnter(a); flushSync()
    expect(container.querySelector('.ui-port-status-grid__tooltip')!.textContent).toBe('ssh (ok)')
    await fireEvent.mouseLeave(a); await fireEvent.mouseEnter(b); flushSync()
    expect(container.querySelector('.ui-port-status-grid__tooltip')).toBeNull()
    await fireEvent.click(screen.getByLabelText('Port 80: warning'))
    expect(onPortClick).toHaveBeenCalledWith(80)
  })
})
