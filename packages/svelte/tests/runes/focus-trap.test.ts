import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import Probe from './focus-trap-probe.svelte'

const tab = (shiftKey = false) => {
  const e = new KeyboardEvent('keydown', { key: 'Tab', shiftKey, bubbles: true, cancelable: true })
  ;(document.activeElement as HTMLElement).dispatchEvent(e)
  return e
}
const cls = () => (document.activeElement as HTMLElement).className

describe('useFocusTrap (Svelte twin)', () => {
  it('focuses the first focusable on activation, wraps Tab both ways, and returns focus', async () => {
    const { container, rerender } = render(Probe)
    ;(container.querySelector('.outside') as HTMLElement).focus()
    await rerender({ active: true })
    flushSync()
    expect(cls()).toBe('one')
    // Middle elements: the browser moves focus, the trap does nothing.
    ;(container.querySelector('.two') as HTMLElement).focus()
    expect(tab().defaultPrevented).toBe(false)
    ;(container.querySelector('.three') as HTMLElement).focus()
    expect(tab().defaultPrevented).toBe(true)
    expect(cls()).toBe('one')
    expect(tab(true).defaultPrevented).toBe(true)
    expect(cls()).toBe('three')
    await rerender({ active: false })
    flushSync()
    expect(cls()).toBe('outside')
    ;(container.querySelector('.three') as HTMLElement).focus()
    expect(tab().defaultPrevented).toBe(false)
  })

  it('honours an initialFocus getter and returnFocus=false', async () => {
    const { container, rerender } = render(Probe, { props: { useInitial: true, returnFocus: false } })
    ;(container.querySelector('.outside') as HTMLElement).focus()
    await rerender({ useInitial: true, returnFocus: false, active: true })
    flushSync()
    expect(cls()).toBe('two')
    await rerender({ useInitial: true, returnFocus: false, active: false })
    flushSync()
    expect(cls()).toBe('two')
  })
})
