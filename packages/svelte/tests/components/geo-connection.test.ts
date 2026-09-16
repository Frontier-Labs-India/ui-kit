import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/svelte'
import GeoMap from '../../src/components/GeoMap.svelte'
import ConnectionTestPanel from '../../src/components/ConnectionTestPanel.svelte'
import { geoToSvg } from '../../src/index.js'

describe('GeoMap', () => {
  const points = [{ id: 'a', lat: 10, lng: 20 }]

  it('exports the projection helper', () => {
    expect(geoToSvg(10, 20)).toEqual({ x: 200, y: 80 })
  })

  it('reports click and hover only when interactive', async () => {
    const onPointClick = vi.fn(), onPointHover = vi.fn()
    const off = render(GeoMap, { props: { points, onPointClick, onPointHover } })
    await fireEvent.click(off.container.querySelector('circle')!)
    expect(onPointClick).not.toHaveBeenCalled()

    const on = render(GeoMap, { props: { points, interactive: true, onPointClick, onPointHover } })
    const c = on.container.querySelector('circle')!
    await fireEvent.mouseEnter(c); await fireEvent.click(c); await fireEvent.mouseLeave(c)
    expect(onPointClick).toHaveBeenCalledWith(points[0])
    expect(onPointHover.mock.calls).toEqual([[points[0]], [null]])
  })
})

describe('ConnectionTestPanel', () => {
  it('fires retry when idle and cancel while running', async () => {
    const onRetry = vi.fn(), onCancel = vi.fn()
    const { rerender } = render(ConnectionTestPanel, { props: { steps: [], onRetry, onCancel } })
    await fireEvent.click(screen.getByText(/Retry/))
    await rerender({ steps: [], onRetry, onCancel, running: true })
    await fireEvent.click(screen.getByText('Cancel'))
    expect([onRetry.mock.calls.length, onCancel.mock.calls.length]).toEqual([1, 1])
  })
})
