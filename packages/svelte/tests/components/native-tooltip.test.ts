import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import Probe from './native-tooltip-probe.svelte'

describe('NativeTooltip', () => {
  it('puts title on the caller\'s own element, with no wrapper, and follows content changes', async () => {
    const { container, rerender } = render(Probe, { props: { content: 'First' } })
    const button = container.querySelector('button')!
    expect(button.parentElement).toBe(container)
    expect(button.getAttribute('title')).toBe('First')
    await rerender({ content: 'Second' })
    expect(button.getAttribute('title')).toBe('Second')
  })

  it('binds ref to the caller\'s element through the attachment, and clears it when the element goes', async () => {
    const { container, rerender, component } = render(Probe, { props: { content: 'x' } })
    flushSync()
    expect(component.getRef()).toBe(container.querySelector('button'))
    await rerender({ content: 'x', show: false })
    expect(component.getRef()).toBeNull()
  })

  it('keeps the caller\'s handler when merged with mergeProps', async () => {
    const { container, component } = render(Probe, { props: { content: 'x' } })
    container.querySelector('button')!.click()
    expect(component.getClicks()).toBe(1)
  })
})
