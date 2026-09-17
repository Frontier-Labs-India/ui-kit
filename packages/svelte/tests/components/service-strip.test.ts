import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/svelte'
import ServiceStrip from '../../src/components/ServiceStrip.svelte'

describe('ServiceStrip', () => {
  it('click, Enter and Space report the service; other keys do not', async () => {
    const onServiceClick = vi.fn()
    const services = [{ name: 'api', status: 'running' as const }]
    const { container } = render(ServiceStrip, { props: { services, onServiceClick, motion: 0 } })
    const badge = container.querySelector('.ui-service-strip__badge')!
    await fireEvent.click(badge)
    await fireEvent.keyDown(badge, { key: 'Enter' })
    await fireEvent.keyDown(badge, { key: ' ' })
    await fireEvent.keyDown(badge, { key: 'a' })
    expect(onServiceClick).toHaveBeenCalledTimes(3)
    expect(onServiceClick).toHaveBeenCalledWith(services[0])
  })
})
