import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import SwitchFaceplate from '../../src/components/SwitchFaceplate.svelte'
import HeatmapCalendar from '../../src/components/HeatmapCalendar.svelte'

describe('SwitchFaceplate', () => {
  it('tooltip shows label, status, VLAN and speed; clicks report the port', async () => {
    const onPortClick = vi.fn()
    const port = { id: 7, label: 'uplink', status: 'up' as const, speed: '10G', type: 'sfp' as const, vlan: 0 }
    const { container } = render(SwitchFaceplate, { props: { ports: [port], onPortClick } })
    await fireEvent.mouseEnter(container.querySelector('.ui-switch-faceplate__port')!); flushSync()
    expect([...container.querySelectorAll('.ui-switch-faceplate__tooltip > div')].map(d => d.textContent)).toEqual(['Port 7 — uplink', 'up | VLAN 0', '10G sfp'])
    await fireEvent.click(screen.getByLabelText('Port 7 (uplink): up, 10G'))
    expect(onPortClick).toHaveBeenCalledWith(port)
  })
})

describe('HeatmapCalendar', () => {
  it('reports clicked dates and shows a tooltip on hover when enabled', async () => {
    const onDateClick = vi.fn()
    const { container } = render(HeatmapCalendar, { props: { data: [{ date: '2026-03-04', value: 3 }], showTooltip: true, onDateClick } })
    const cell = screen.getByLabelText('2026-03-04: 3')
    await fireEvent.click(cell)
    await fireEvent.mouseEnter(cell); flushSync()
    expect(onDateClick).toHaveBeenCalledWith('2026-03-04')
    expect(container.querySelector('.ui-heatmap-calendar__tooltip')!.textContent).toBe('2026-03-04: 3')
  })
})
