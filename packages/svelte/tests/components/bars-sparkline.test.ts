import { describe, it, expect } from 'vitest'
import { render, fireEvent } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import StorageBar from '../../src/components/StorageBar.svelte'
import Sparkline from '../../src/components/Sparkline.svelte'
import UtilizationBar from '../../src/components/UtilizationBar.svelte'

describe('hover state', () => {
  it('StorageBar tooltip gives value and share', async () => {
    const { container } = render(StorageBar, { props: { total: 2048, segments: [{ label: 'Photos', value: 512 }] } })
    const seg = container.querySelector('.ui-storage-bar__segment')!
    await fireEvent.mouseEnter(seg); flushSync()
    expect(container.querySelector('.ui-storage-bar__tooltip')!.textContent).toBe('Photos: 512.0 GB (25.0%)')
  })

  it('Sparkline shows the dot and the hovered value, then clears', async () => {
    const { container } = render(Sparkline, { props: { data: [1, 9, 4], showTooltip: true } })
    const hits = container.querySelectorAll('.ui-sparkline__hit-area')
    expect(hits).toHaveLength(3)
    await fireEvent.mouseEnter(hits[1]); flushSync()
    expect(container.querySelector('.ui-sparkline__dot')).not.toBeNull()
    expect(container.querySelector('.ui-sparkline__tooltip')!.textContent).toBe('9')
    await fireEvent.mouseLeave(hits[1]); flushSync()
    expect(container.querySelector('.ui-sparkline__tooltip')).toBeNull()
  })

  it('UtilizationBar tooltip labels value over max', async () => {
    const { container } = render(UtilizationBar, { props: { max: 200, segments: [{ value: 50, label: 'CPU' }, { value: 20 }] } })
    const [a, b] = container.querySelectorAll('.ui-utilization-bar__segment')
    await fireEvent.mouseEnter(a); flushSync()
    expect(container.querySelector('.ui-utilization-bar__tooltip')!.textContent).toBe('CPU: 50 / 200')
    await fireEvent.mouseLeave(a); await fireEvent.mouseEnter(b); flushSync()
    expect(container.querySelector('.ui-utilization-bar__tooltip')!.textContent).toBe('20 / 200')
  })
})
