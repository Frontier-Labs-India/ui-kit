import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import VlanBusBar from '../../src/components/VlanBusBar.svelte'

const vlans = [
  { id: 10, name: 'mgmt', ports: [1, 2] },
  { id: 20, ports: [2, 3], tagged: true },
]

describe('VlanBusBar hover highlighting', () => {
  it('hovering a port highlights VLANs on it and dims the rest', async () => {
    const onPortHover = vi.fn()
    const { container } = render(VlanBusBar, { props: { vlans, totalPorts: 3, onPortHover } })
    const areas = container.querySelectorAll('.ui-vlan-bus-bar__port-tick-area')
    await fireEvent.mouseEnter(areas[0]); flushSync()   // port 1: only VLAN 10
    const row = (id: number) => container.querySelector(`[data-testid="vlan-row-${id}"]`)!
    expect(row(10).querySelector('.ui-vlan-bus-bar__segment--highlighted')).not.toBeNull()
    expect(row(20).querySelectorAll('.ui-vlan-bus-bar__segment--dimmed')).toHaveLength(2)
    await fireEvent.mouseLeave(areas[0]); flushSync()
    expect(container.querySelector('.ui-vlan-bus-bar__segment--dimmed')).toBeNull()
    expect(onPortHover.mock.calls).toEqual([[1], [null]])
  })

  it('hovering a VLAN shows its tooltip and reports it; clicks report VLANs and ports', async () => {
    const onVlanClick = vi.fn(), onPortClick = vi.fn()
    const { container } = render(VlanBusBar, { props: { vlans, totalPorts: 3, onVlanClick, onPortClick } })
    const seg = container.querySelector('[data-testid="vlan-row-20"] .ui-vlan-bus-bar__segment')!
    await fireEvent.mouseEnter(seg); flushSync()
    expect([...container.querySelectorAll('.ui-vlan-bus-bar__tooltip div')].map(d => d.textContent)).toEqual(['VLAN 20', '2 ports', 'Tagged (trunk)'])
    await fireEvent.click(seg)
    await fireEvent.click(container.querySelectorAll('.ui-vlan-bus-bar__port-tick-area')[1])
    expect(onVlanClick).toHaveBeenCalledWith(vlans[1])
    expect(onPortClick).toHaveBeenCalledWith(2, vlans)
  })
})
