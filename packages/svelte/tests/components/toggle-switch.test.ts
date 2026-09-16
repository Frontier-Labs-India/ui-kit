import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import ToggleSwitch from '../../src/components/ToggleSwitch.svelte'
import BindProbe from './toggle-switch-bind-probe.svelte'

const input = (c: Element) => c.querySelector('input') as HTMLInputElement

describe('ToggleSwitch', () => {
  it('uncontrolled: starts from defaultChecked, toggles natively, never sets aria-checked', async () => {
    const { container } = render(ToggleSwitch, { props: { label: 'Wi-Fi', defaultChecked: true } })
    expect(input(container).checked).toBe(true)
    await fireEvent.click(input(container))
    expect(input(container).checked).toBe(false)
    expect(input(container).hasAttribute('aria-checked')).toBe(false)
  })

  it('controlled: aria-checked mirrors the prop', () => {
    const { container } = render(ToggleSwitch, { props: { label: 'Wi-Fi', checked: false } })
    expect(input(container).getAttribute('aria-checked')).toBe('false')
  })

  it('bind:checked writes the new state back to the parent', async () => {
    const { container } = render(BindProbe)
    expect(container.querySelector('output')!.textContent).toBe('false')
    await fireEvent.click(input(container))
    flushSync()
    expect(container.querySelector('output')!.textContent).toBe('true')
    expect(input(container).getAttribute('aria-checked')).toBe('true')
  })

  it("calls the caller's onchange", async () => {
    const onchange = vi.fn()
    const { container } = render(ToggleSwitch, { props: { label: 'x', onchange } })
    await fireEvent.click(input(container))
    expect(onchange).toHaveBeenCalledOnce()
  })

  it('the label toggles the switch', async () => {
    const { container } = render(ToggleSwitch, { props: { label: 'Wi-Fi' } })
    await fireEvent.click(container.querySelector('label')!)
    expect(input(container).checked).toBe(true)
  })
})
