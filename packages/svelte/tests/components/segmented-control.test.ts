import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import SegmentedControl from '../../src/components/SegmentedControl.svelte'
import BindProbe from './value-bind-probe.svelte'

afterEach(() => vi.restoreAllMocks())

const radios = (c: HTMLElement) => Array.from(c.querySelectorAll<HTMLButtonElement>('[role="radio"]'))
const checked = (c: HTMLElement) => radios(c).find(r => r.getAttribute('aria-checked') === 'true')?.textContent

describe('SegmentedControl', () => {
  it('bind:value is two-way; clicks and onChange', async () => {
    const onChange = vi.fn()
    const { container } = render(BindProbe, { props: { field: SegmentedControl, initial: 'b', props: { data: ['a', 'b', 'c'], onChange, 'aria-label': 'x' } } })
    expect(checked(container)).toBe('b')
    await fireEvent.click(radios(container)[2])
    expect(container.querySelector('output')!.textContent).toBe('"c"')
    expect(onChange).toHaveBeenCalledWith('c')
    expect(radios(container)[2].tabIndex).toBe(0)
  })

  it('arrow keys wrap over enabled options and move focus; Home/End; vertical uses Up/Down', async () => {
    const data = [{ value: 'a', label: 'A' }, { value: 'b', label: 'B', disabled: true }, { value: 'c', label: 'C' }]
    const { container } = render(SegmentedControl, { props: { data, 'aria-label': 'x' } })
    const group = container.querySelector('[role="radiogroup"]')!
    await fireEvent.keyDown(group, { key: 'ArrowRight' })
    expect(checked(container)).toBe('C')
    expect(document.activeElement).toBe(radios(container)[2])
    await fireEvent.keyDown(group, { key: 'ArrowRight' })
    expect(checked(container)).toBe('A')
    await fireEvent.keyDown(group, { key: 'End' })
    expect(checked(container)).toBe('C')
    await fireEvent.keyDown(group, { key: 'ArrowDown' }) // horizontal: ignored
    expect(checked(container)).toBe('C')

    const v = render(SegmentedControl, { props: { data: ['x', 'y'], orientation: 'vertical', 'aria-label': 'v' } })
    await fireEvent.keyDown(v.container.querySelector('[role="radiogroup"]')!, { key: 'ArrowDown' })
    expect(checked(v.container)).toBe('y')
  })

  it('disabled, readOnly and disabled options ignore selection', async () => {
    const onChange = vi.fn()
    for (const extra of [{ disabled: true }, { readOnly: true }]) {
      const { container } = render(SegmentedControl, { props: { data: ['a', 'b'], onChange, 'aria-label': 'x', ...extra } })
      await fireEvent.click(radios(container)[1])
      expect(checked(container)).toBe('a')
    }
    const { container } = render(SegmentedControl, { props: { data: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B', disabled: true }], onChange, 'aria-label': 'x' } })
    await fireEvent.click(radios(container)[1])
    expect(onChange).not.toHaveBeenCalled()
  })

  it('moves the indicator to the active item, horizontally and vertically', async () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      if (this.getAttribute('role') === 'radiogroup') return { left: 10, top: 20, width: 300, height: 90 } as DOMRect
      const i = Array.from(this.parentElement!.querySelectorAll('[role="radio"]')).indexOf(this)
      return { left: 13 + i * 100, top: 23 + i * 30, width: 100, height: 30 } as DOMRect
    })
    const { container, rerender } = render(SegmentedControl, { props: { data: ['a', 'b', 'c'], value: 'b', 'aria-label': 'x' } })
    const ind = container.querySelector<HTMLElement>('.ui-segmented__indicator')!
    expect(ind.style.transform).toBe('translateX(100px)')
    expect(ind.style.inlineSize).toBe('100px')
    await rerender({ data: ['a', 'b', 'c'], value: 'c', orientation: 'vertical', 'aria-label': 'x' })
    flushSync()
    expect(ind.style.transform).toBe('translateY(60px)')
    expect(ind.style.blockSize).toBe('30px')
    expect(ind.style.inlineSize).toBe('calc(100% - 6px)')
  })
})
