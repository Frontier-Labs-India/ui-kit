import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/svelte'
import TransferList from '../../src/components/TransferList.svelte'
import BindProbe from './value-bind-probe.svelte'

const A = { value: 'a', label: 'Alpha' }
const B = { value: 'b', label: 'Beta' }
const C = { value: 'c', label: 'Gamma' }
const out = (c: HTMLElement) => (JSON.parse(c.querySelector('output')!.textContent!) as { value: string }[][]).map(side => side.map(i => i.value))
const option = (c: HTMLElement, label: string) =>
  Array.from(c.querySelectorAll<HTMLElement>('[role="option"]')).find(o => o.textContent?.includes(label))!
const btn = (c: HTMLElement, name: string) => c.querySelector<HTMLButtonElement>(`[aria-label="${name}"]`)!

describe('TransferList', () => {
  it('moves selected items right and left, updating counts and clearing selection (bind:value)', async () => {
    const onChange = vi.fn()
    const { container } = render(BindProbe, { props: { field: TransferList, initial: [[A, B], [C]], props: { onChange } } })
    expect(btn(container, 'Transfer selected to right').disabled).toBe(true)
    await fireEvent.click(option(container, 'Beta'))
    expect(option(container, 'Beta').getAttribute('aria-selected')).toBe('true')
    expect(container.querySelector('.ui-transfer-list__count')!.textContent).toBe('1 / 2')
    await fireEvent.click(btn(container, 'Transfer selected to right'))
    expect(out(container)).toEqual([['a'], ['c', 'b']])
    expect(onChange).toHaveBeenCalledOnce()
    expect(btn(container, 'Transfer selected to right').disabled).toBe(true)
    await fireEvent.click(option(container, 'Gamma'))
    await fireEvent.click(btn(container, 'Transfer selected to left'))
    expect(out(container)).toEqual([['a', 'c'], ['b']])
  })

  it('moves only selected items that match the current search', async () => {
    const { container } = render(BindProbe, { props: { field: TransferList, initial: [[A, B, C], []], props: { searchable: true } } })
    await fireEvent.click(option(container, 'Alpha'))
    await fireEvent.click(option(container, 'Beta'))
    const search = container.querySelector<HTMLInputElement>('[aria-label="Search Source"]')!
    search.value = 'bet'
    await fireEvent.input(search)
    expect(Array.from(container.querySelectorAll('.ui-transfer-list__item-label')).map(l => l.textContent)).toEqual(['Beta'])
    await fireEvent.click(btn(container, 'Transfer selected to right'))
    expect(out(container)).toEqual([['a', 'c'], ['b']])
  })

  it('transfers everything either way', async () => {
    const { container } = render(BindProbe, { props: { field: TransferList, initial: [[A], [B]], props: {} } })
    await fireEvent.click(btn(container, 'Transfer all to right'))
    expect(out(container)).toEqual([[], ['b', 'a']])
    expect(btn(container, 'Transfer all to right').disabled).toBe(true)
    await fireEvent.click(btn(container, 'Transfer all to left'))
    expect(out(container)).toEqual([['b', 'a'], []])
  })
})
