import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/svelte'
import type { Component } from 'svelte'
import { SmartTable } from '../../src/index.js'
import Probe from './smart-table-probe.svelte'

const ROWS = [{ name: 'Ada', score: 2 }, { name: 'Grace', score: 1 }]
const COLS = [{ id: 'name', header: 'Name', accessor: 'name' }, { id: 'score', header: 'Score', accessor: 'score' }]
const Table = SmartTable as unknown as Component<Record<string, unknown>>

describe('SmartTable', () => {
  it('filterable turns on search, not column filters', () => {
    const { container } = render(Table, { props: { data: ROWS, columns: COLS, filterable: true } })
    expect(container.querySelector('input[type="search"]')).not.toBeNull()
    expect(container.querySelector('.ui-data-table__filter-btn')).toBeNull()
  })

  it('forwards bound values and callbacks to DataTable', async () => {
    const onSort = vi.fn()
    const { container, component } = render(Probe, { props: { data: ROWS, columns: COLS, onSort } })
    await fireEvent.click(container.querySelector<HTMLElement>('th[aria-sort]')!)
    expect(component.get()).toEqual([{ column: 'name', direction: 'asc' }])
    expect(onSort).toHaveBeenCalledWith([{ column: 'name', direction: 'asc' }])
  })

  it('class goes on the wrapper; other attributes on the table root', () => {
    const { container } = render(Table, { props: { data: ROWS, columns: COLS, class: 'mine', id: 't' } })
    const wrapper = container.querySelector('.ui-smart-table')!
    expect(wrapper.className).toBe('ui-smart-table mine')
    expect(wrapper.firstElementChild!.id).toBe('t')
    expect(wrapper.firstElementChild!.classList.contains('ui-data-table')).toBe(true)
  })
})
