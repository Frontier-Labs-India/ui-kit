import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/svelte'
import { flushSync, createRawSnippet } from 'svelte'
import type { Component } from 'svelte'
import { DataTable } from '../../src/index.js'
// Rows are plain test objects; the generic's inference is not under test here.
const Table = DataTable as unknown as Component<Record<string, unknown>>
import Probe from './data-table-probe.svelte'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROWS = [
  { id: 1, name: 'Ada', team: 'Core', score: 91 },
  { id: 2, name: 'Grace', team: 'Infra', score: 78 },
  { id: 3, name: 'Linus', team: 'Core', score: 85 },
  { id: 4, name: 'Barbara', team: 'Infra', score: 99 },
  { id: 5, name: 'Edsger', team: 'Core', score: 62 },
]
const COLS = [
  { id: 'name', header: 'Name', accessor: 'name' as const },
  { id: 'team', header: 'Team', accessor: 'team' as const },
  { id: 'score', header: 'Score', accessor: 'score' as const },
]
const MANY = Array.from({ length: 95 }, (_, i) => ({ id: i, name: `Row ${i}`, team: i % 2 ? 'Odd' : 'Even', score: i }))

const q = <E extends Element = HTMLElement>(c: ParentNode, sel: string) => Array.from(c.querySelectorAll<E & HTMLElement>(sel))
const th = (c: ParentNode, label: string) => q(c, 'th.ui-data-table__th').find(h => h.textContent?.trim().startsWith(label))!
const names = (c: ParentNode) => q(c, 'tbody tr.ui-data-table__tr').map(r => r.querySelector('[data-label="Name"]')?.textContent)
const rowBoxes = (c: ParentNode) => q<HTMLInputElement>(c, 'tbody .ui-data-table__checkbox')

beforeAll(() => {
  Element.prototype.setPointerCapture ??= function () {}
})
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); cleanup() })

describe('DataTable — sorting', () => {
  it('a header click cycles ascending, descending, none, reporting each through onSort', async () => {
    const onSort = vi.fn()
    const { container } = render(Probe, { props: { data: ROWS, columns: COLS, onSort } })
    await fireEvent.click(th(container, 'Score'))
    expect(names(container)).toEqual(['Edsger', 'Grace', 'Linus', 'Ada', 'Barbara'])
    expect(th(container, 'Score').getAttribute('aria-sort')).toBe('ascending')
    await fireEvent.click(th(container, 'Score'))
    expect(names(container)[0]).toBe('Barbara')
    expect(th(container, 'Score').getAttribute('aria-sort')).toBe('descending')
    await fireEvent.click(th(container, 'Score'))
    expect(names(container)).toEqual(['Ada', 'Grace', 'Linus', 'Barbara', 'Edsger'])
    expect(onSort.mock.calls).toEqual([
      [[{ column: 'score', direction: 'asc' }]],
      [[{ column: 'score', direction: 'desc' }]],
      [[]],
    ])
  })

  it('shift-click builds a multi-sort with numbered badges; shift on a desc column removes it', async () => {
    const { container, component } = render(Probe, { props: { data: ROWS, columns: COLS } })
    await fireEvent.click(th(container, 'Team'))
    await fireEvent.click(th(container, 'Score'), { shiftKey: true })
    expect(component.get().sortBy).toEqual([{ column: 'team', direction: 'asc' }, { column: 'score', direction: 'asc' }])
    expect(names(container)).toEqual(['Edsger', 'Linus', 'Ada', 'Grace', 'Barbara'])
    expect(q(container, '.ui-data-table__sort-badge').map(b => b.textContent)).toEqual(['1', '2'])
    await fireEvent.click(th(container, 'Score'), { shiftKey: true })
    await fireEvent.click(th(container, 'Score'), { shiftKey: true })
    expect(component.get().sortBy).toEqual([{ column: 'team', direction: 'asc' }])
    expect(q(container, '.ui-data-table__sort-badge')).toHaveLength(0)
  })

  it('ignores clicks on columns that are not sortable', async () => {
    const onSort = vi.fn()
    const { container } = render(Table, { props: { data: ROWS, columns: [{ ...COLS[0], sortable: false }, COLS[1]], onSort } })
    await fireEvent.click(th(container, 'Name'))
    expect(onSort).not.toHaveBeenCalled()
    expect(th(container, 'Name').hasAttribute('aria-sort')).toBe(false)
  })
})

describe('DataTable — selection uses the row index in the sorted, unpaginated data', () => {
  it('row checkboxes on page 2 select global indices; select-all takes the page, then clears', async () => {
    const onSelectionChange = vi.fn()
    const { container, component } = render(Probe, { props: { data: ROWS, columns: COLS, selectable: true, paginated: true, pageSize: 2, onSelectionChange } })
    await fireEvent.click(container.querySelector<HTMLElement>('[aria-label="Page 2"]')!)
    expect(rowBoxes(container).map(b => b.getAttribute('aria-label'))).toEqual(['Select row 3', 'Select row 4'])
    await fireEvent.click(rowBoxes(container)[0])
    expect(component.get().selectedRows).toEqual([2])
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set([2]))
    const all = container.querySelector<HTMLInputElement>('[aria-label="Select all rows"]')!
    expect(all.indeterminate).toBe(true)
    await fireEvent.click(all)
    expect(component.get().selectedRows).toEqual([2, 3])
    expect(all.checked).toBe(true)
    expect(all.indeterminate).toBe(false)
    expect(q(container, 'tbody tr[aria-selected="true"]')).toHaveLength(2)
    await fireEvent.click(all)
    expect(component.get().selectedRows).toEqual([])
  })

  it('after sorting, index 0 is the first sorted row', async () => {
    const { container, component } = render(Probe, { props: { data: ROWS, columns: COLS, selectable: true, initialSort: [{ column: 'score', direction: 'desc' }] } })
    await fireEvent.click(rowBoxes(container)[0])
    expect(component.get().selectedRows).toEqual([0])
    expect(q(container, 'tbody tr[data-selected]')[0].textContent).toContain('Barbara')
  })
})

describe('DataTable — search', () => {
  it('filters after a 300ms debounce, highlights matches, counts results, and resets to page 1', async () => {
    vi.useFakeTimers()
    const onSearchChange = vi.fn()
    const { container } = render(Table, { props: { data: ROWS, columns: COLS, searchable: true, paginated: true, pageSize: 2, onSearchChange } })
    await fireEvent.click(container.querySelector<HTMLElement>('[aria-label="Page 3"]')!)
    const box = container.querySelector<HTMLInputElement>('input[type="search"]')!
    await fireEvent.input(box, { target: { value: 'in' } })
    expect(onSearchChange).toHaveBeenLastCalledWith('in')
    expect(names(container)).toEqual(['Edsger'])
    vi.advanceTimersByTime(299)
    flushSync()
    expect(names(container)).toEqual(['Edsger'])
    vi.advanceTimersByTime(1)
    flushSync()
    // Grace and Barbara match on team, Linus on name; page 1 of the 3 results.
    expect(names(container)).toEqual(['Grace', 'Linus'])
    expect(container.querySelector('.ui-data-table__result-count')!.textContent).toBe('3 results')
    expect(q(container, 'mark.ui-data-table__search-highlight').map(m => m.textContent)).toEqual(['In', 'in'])
    expect(container.querySelector('[aria-current="page"]')!.textContent).toBe('1')
    await fireEvent.click(container.querySelector<HTMLElement>('[aria-label="Clear search"]')!)
    expect(box.value).toBe('')
    expect(onSearchChange).toHaveBeenLastCalledWith('')
    vi.advanceTimersByTime(300)
    flushSync()
    expect(container.querySelector('.ui-data-table__result-count')).toBeNull()
  })

  it('says "1 result", skips columns that opt out, and leaves custom cells unhighlighted', async () => {
    vi.useFakeTimers()
    const scoreCell = createRawSnippet((v: () => unknown) => ({ render: () => `<i>${String(v())}</i>` }))
    const { container } = render(Table, { props: { data: ROWS, searchable: true, columns: [COLS[0], { ...COLS[1], searchable: false }, { ...COLS[2], header: 'Score2', cell: scoreCell }] } })
    await fireEvent.input(container.querySelector('input[type="search"]')!, { target: { value: 'core' } })
    vi.advanceTimersByTime(300)
    flushSync()
    expect(container.querySelector('.ui-data-table__empty')!.textContent).toBe('No data')
    await fireEvent.input(container.querySelector('input[type="search"]')!, { target: { value: 'barb' } })
    vi.advanceTimersByTime(300)
    flushSync()
    expect(container.querySelector('.ui-data-table__result-count')!.textContent).toBe('1 result')
    expect(q(container, 'mark').map(m => m.textContent)).toEqual(['Barb'])
    await fireEvent.input(container.querySelector('input[type="search"]')!, { target: { value: '99' } })
    vi.advanceTimersByTime(300)
    flushSync()
    const cell = container.querySelector('td[data-label="Score2"]')!
    expect(cell.querySelector('i')!.textContent).toBe('99')
    expect(cell.querySelector('mark')).toBeNull()
  })
})

describe('DataTable — pagination', () => {
  it('pages, reports page changes, shows ellipses around the current page, and disables the ends', async () => {
    const onPageChange = vi.fn()
    const { container } = render(Table, { props: { data: MANY, columns: COLS, paginated: true, onPageChange } })
    const prev = container.querySelector<HTMLButtonElement>('[aria-label="Previous page"]')!
    const next = container.querySelector<HTMLButtonElement>('[aria-label="Next page"]')!
    expect(prev.disabled).toBe(true)
    for (let i = 0; i < 5; i++) await fireEvent.click(next)
    expect(onPageChange.mock.calls.map(c => c[0])).toEqual([1, 2, 3, 4, 5])
    const controls = container.querySelector('.ui-data-table__page-controls')!
    expect(Array.from(controls.children).slice(1, -2).map(e => e.textContent)).toEqual(['1', '…', '5', '6', '7', '…', '10'])
    expect(container.querySelector('.ui-data-table__page-info')!.textContent).toBe('Showing 51–60 of 95 results')
    await fireEvent.click(container.querySelector<HTMLElement>('[aria-label="Page 10"]')!)
    expect(next.disabled).toBe(true)
    expect(names(container)).toEqual(['Row 90', 'Row 91', 'Row 92', 'Row 93', 'Row 94'])
  })

  it('the page-size select resizes pages and returns to page 1; "All" shows every row', async () => {
    const { container } = render(Table, { props: { data: MANY, columns: COLS, paginated: true, pageSizes: [10, 50] } })
    await fireEvent.click(container.querySelector<HTMLElement>('[aria-label="Page 2"]')!)
    const select = container.querySelector<HTMLSelectElement>('[aria-label="Page size"]')!
    await fireEvent.change(select, { target: { value: '50' } })
    expect(names(container)).toHaveLength(50)
    expect(container.querySelector('[aria-current="page"]')!.textContent).toBe('1')
    await fireEvent.change(select, { target: { value: 'all' } })
    expect(names(container)).toHaveLength(95)
    expect(container.querySelector('.ui-data-table__page-info')!.textContent).toBe('Showing all 95 results')
    expect(select.value).toBe('all')
  })

  it('returns to page 1 when the data length changes', async () => {
    const { container, rerender } = render(Table, { props: { data: MANY, columns: COLS, paginated: true } })
    await fireEvent.click(container.querySelector<HTMLElement>('[aria-label="Page 2"]')!)
    expect(container.querySelector('[aria-current="page"]')!.textContent).toBe('2')
    await rerender({ data: MANY.slice(0, 60) })
    expect(container.querySelector('[aria-current="page"]')!.textContent).toBe('1')
  })
})

describe('DataTable — column visibility', () => {
  it('toggles columns, shows and hides all, and closes on an outside mousedown only', async () => {
    const { container } = render(Table, { props: { data: ROWS, columns: [...COLS, { id: 'id', header: 'Id', accessor: 'id' as const, hidden: true }] } })
    const toggle = container.querySelector<HTMLElement>('[aria-label="Toggle columns"]')!
    await fireEvent.click(toggle)
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
    const items = q<HTMLInputElement>(container, '.ui-data-table__col-checkbox')
    expect(items.map(i => i.checked)).toEqual([true, true, true, false])
    await fireEvent.click(items[1])
    expect(q(container, 'th.ui-data-table__th').map(h => h.textContent?.trim())).toEqual(['Name', 'Score'])
    await fireEvent.click(container.querySelector<HTMLElement>('.ui-data-table__col-dropdown-actions button')!)
    expect(q(container, 'th.ui-data-table__th')).toHaveLength(4)
    await fireEvent.click(q(container, '.ui-data-table__col-dropdown-actions button')[1])
    expect(q(container, 'th.ui-data-table__th')).toHaveLength(0)
    await fireEvent.mouseDown(container.querySelector('.ui-data-table__col-dropdown')!)
    expect(container.querySelector('.ui-data-table__col-dropdown')).not.toBeNull()
    await fireEvent.mouseDown(document.body)
    expect(container.querySelector('.ui-data-table__col-dropdown')).toBeNull()
  })
})

describe('DataTable — export', () => {
  it('hands sorted data to onExport and closes the menu', async () => {
    const onExport = vi.fn()
    const { container } = render(Table, { props: { data: ROWS, columns: COLS, exportable: true, onExport, sortBy: [{ column: 'score', direction: 'asc' }] } })
    await fireEvent.click(container.querySelector<HTMLElement>('[aria-label="Export"]')!)
    await fireEvent.click(q(container, '.ui-data-table__export-item')[1])
    expect(onExport).toHaveBeenCalledWith('json', [ROWS[4], ROWS[1], ROWS[2], ROWS[0], ROWS[3]])
    expect(container.querySelector('.ui-data-table__export-dropdown')).toBeNull()
  })

  it('without onExport downloads CSV of the visible columns, escaping quotes and commas', async () => {
    const blobs: Blob[] = []
    URL.createObjectURL = vi.fn((b: Blob) => { blobs.push(b); return 'blob:x' }) as never
    URL.revokeObjectURL = vi.fn()
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.download).toBe('export.csv')
    })
    const { container } = render(Table, { props: { data: [{ name: 'A, "B"', team: 'x', score: 1 }], columns: [COLS[0], { ...COLS[2], hidden: true }], exportable: true } })
    await fireEvent.click(container.querySelector<HTMLElement>('[aria-label="Export"]')!)
    await fireEvent.click(q(container, '.ui-data-table__export-item')[0])
    expect(click).toHaveBeenCalledTimes(1)
    expect(await blobs[0].text()).toBe('Name\n"A, ""B"""')
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:x')
  })

  it('closes the export menu on an outside mousedown', async () => {
    const { container } = render(Table, { props: { data: ROWS, columns: COLS, exportable: true } })
    await fireEvent.click(container.querySelector<HTMLElement>('[aria-label="Export"]')!)
    await fireEvent.mouseDown(document.body)
    expect(container.querySelector('.ui-data-table__export-dropdown')).toBeNull()
  })
})

describe('DataTable — column filters', () => {
  it('opens a popover in document.body, filters as the value changes, and does not sort', async () => {
    const onSort = vi.fn()
    const { container, component } = render(Probe, { props: { data: ROWS, columns: COLS, filterable: true, onSort } })
    const btn = th(container, 'Team').querySelector<HTMLElement>('.ui-data-table__filter-btn')!
    await fireEvent.click(btn)
    expect(onSort).not.toHaveBeenCalled()
    const root = container.querySelector('.ui-data-table')!
    expect(root.hasAttribute('data-filter-open')).toBe(true)
    const pop = document.body.querySelector<HTMLElement>('[data-testid="filter-popover-team"]')!
    expect(root.contains(pop)).toBe(false)
    expect(pop.previousElementSibling?.className).toBe('ui-data-table__filter-backdrop')
    await fireEvent.input(document.querySelector('[data-testid="filter-input-team"]')!, { target: { value: 'inf' } })
    expect(component.get().filters).toEqual({ team: { value: 'inf', operator: 'contains' } })
    expect(names(container)).toEqual(['Grace', 'Barbara'])
    expect(btn.hasAttribute('data-active')).toBe(true)
    await fireEvent.change(document.querySelector('[data-testid="filter-operator-team"]')!, { target: { value: 'equals' } })
    expect(component.get().filters).toEqual({ team: { value: 'inf', operator: 'equals' } })
    expect(container.querySelector('.ui-data-table__empty')).not.toBeNull()
    await fireEvent.click(Array.from(pop.querySelectorAll('button')).find(b => b.textContent === 'Apply')!)
    expect(document.querySelector('[data-testid="filter-popover-team"]')).toBeNull()
    expect(root.hasAttribute('data-filter-open')).toBe(false)
  })

  it('positions the popover under its button through setProperty', async () => {
    const { container } = render(Table, { props: { data: ROWS, columns: COLS, filterable: true } })
    const btn = th(container, 'Name').querySelector<HTMLElement>('.ui-data-table__filter-btn')!
    btn.getBoundingClientRect = () => ({ top: 10, left: 3, bottom: 30, right: 0, width: 0, height: 0, x: 0, y: 0, toJSON() {} })
    await fireEvent.click(btn)
    const pop = document.querySelector<HTMLElement>('[data-testid="filter-popover-name"]')!
    expect(pop.style.getPropertyValue('top')).toBe('34px')
    expect(pop.style.getPropertyValue('left')).toBe('8px')
  })

  it('select filters toggle options as isOneOf; Clear removes the filter and closes; the backdrop closes', async () => {
    const onFilterChange = vi.fn()
    const { container } = render(Table, { props: { data: ROWS, filterable: true, onFilterChange, columns: [COLS[0], { ...COLS[1], filterType: 'select' }] } })
    await fireEvent.click(th(container, 'Team').querySelector('.ui-data-table__filter-btn')!)
    const boxes = q<HTMLInputElement>(document.body, '.ui-data-table__filter-select-item input')
    expect(q(document.body, '.ui-data-table__filter-select-item').map(l => l.textContent)).toEqual(['Core', 'Infra'])
    await fireEvent.click(boxes[1])
    expect(onFilterChange).toHaveBeenLastCalledWith({ team: { value: 'infra', operator: 'isOneOf' } })
    await fireEvent.click(q<HTMLInputElement>(document.body, '.ui-data-table__filter-select-item input')[0])
    expect(onFilterChange).toHaveBeenLastCalledWith({ team: { value: 'infra,core', operator: 'isOneOf' } })
    await fireEvent.click(q<HTMLInputElement>(document.body, '.ui-data-table__filter-select-item input')[1])
    expect(onFilterChange).toHaveBeenLastCalledWith({ team: { value: 'core', operator: 'isOneOf' } })
    await fireEvent.click(document.body.querySelector('.ui-data-table__filter-actions button')!)
    expect(onFilterChange).toHaveBeenLastCalledWith({})
    expect(document.querySelector('.ui-data-table__filter-popover')).toBeNull()
    await fireEvent.click(th(container, 'Team').querySelector('.ui-data-table__filter-btn')!)
    await fireEvent.click(document.querySelector('.ui-data-table__filter-backdrop')!)
    expect(document.querySelector('.ui-data-table__filter-popover')).toBeNull()
  })

  it('the filter button toggles its popover and removes it from the body on unmount', async () => {
    const { container, unmount } = render(Table, { props: { data: ROWS, columns: COLS, filterable: true } })
    const btn = th(container, 'Name').querySelector<HTMLElement>('.ui-data-table__filter-btn')!
    await fireEvent.click(btn)
    await fireEvent.click(btn)
    expect(document.querySelector('.ui-data-table__filter-popover')).toBeNull()
    await fireEvent.click(btn)
    unmount()
    expect(document.querySelector('.ui-data-table__filter-popover, .ui-data-table__filter-backdrop')).toBeNull()
  })
})

describe('DataTable — grouping', () => {
  it('a group row toggles its rows, reporting onGroupToggle, with child rows at their sorted index', async () => {
    const onGroupToggle = vi.fn()
    const { container, component } = render(Probe, { props: { data: ROWS, columns: COLS, groupBy: 'team', selectable: true, onGroupToggle } })
    expect(names(container)).toEqual([])
    await fireEvent.click(container.querySelector<HTMLElement>('[data-testid="group-row-Infra"]')!)
    expect(onGroupToggle).toHaveBeenCalledWith('Infra')
    expect(component.get().expandedGroups).toEqual(['Infra'])
    expect(names(container)).toEqual(['Grace', 'Barbara'])
    expect(rowBoxes(container).map(b => b.getAttribute('aria-label'))).toEqual(['Select row 2', 'Select row 4'])
    await fireEvent.click(container.querySelector<HTMLElement>('[data-testid="group-row-Infra"]')!)
    expect(names(container)).toEqual([])
  })
})

describe('DataTable — cell editing', () => {
  it('a double click edits; Enter commits to both callbacks and marks the cell for 600ms', async () => {
    vi.useFakeTimers()
    const onCellEdit = vi.fn(), colEdit = vi.fn()
    const { container } = render(Table, { props: { data: ROWS, editable: true, onCellEdit, columns: [{ ...COLS[0], onCellEdit: colEdit }, { ...COLS[1], editable: false }], sortBy: [{ column: 'name', direction: 'desc' }] } })
    const cell = q(container, 'td[data-label="Name"]')[1]
    await fireEvent.dblClick(cell)
    const input = container.querySelector<HTMLInputElement>('[data-testid="edit-input-name"]')!
    expect(input.value).toBe('Grace')
    expect(document.activeElement).toBe(input)
    expect(cell.hasAttribute('data-editing')).toBe(true)
    await fireEvent.input(input, { target: { value: 'Torvalds' } })
    await fireEvent.keyDown(input, { key: 'Enter' })
    expect(onCellEdit).toHaveBeenCalledWith(1, 'name', 'Torvalds')
    expect(colEdit).toHaveBeenCalledWith(1, 'Torvalds')
    expect(onCellEdit).toHaveBeenCalledTimes(1)
    expect(container.querySelector('[data-testid="edit-input-name"]')).toBeNull()
    expect(q(container, 'td[data-label="Name"]')[1].hasAttribute('data-just-edited')).toBe(true)
    vi.advanceTimersByTime(600)
    flushSync()
    expect(container.querySelector('[data-just-edited]')).toBeNull()
    await fireEvent.dblClick(q(container, 'td[data-label="Team"]')[0])
    expect(container.querySelector('.ui-data-table__edit-input')).toBeNull()
  })

  it('Escape cancels without a callback; blur commits', async () => {
    const onCellEdit = vi.fn()
    const { container } = render(Table, { props: { data: ROWS, columns: COLS, editable: true, onCellEdit } })
    await fireEvent.dblClick(q(container, 'td[data-label="Team"]')[0])
    await fireEvent.keyDown(container.querySelector('.ui-data-table__edit-input')!, { key: 'Escape' })
    expect(container.querySelector('.ui-data-table__edit-input')).toBeNull()
    expect(onCellEdit).not.toHaveBeenCalled()
    await fireEvent.dblClick(q(container, 'td[data-label="Team"]')[2])
    await fireEvent.blur(container.querySelector('.ui-data-table__edit-input')!)
    expect(onCellEdit).toHaveBeenCalledWith(2, 'team', 'Core')
  })

  it('cells are not editable unless the table is', async () => {
    const { container } = render(Table, { props: { data: ROWS, columns: COLS } })
    await fireEvent.dblClick(q(container, 'td[data-label="Name"]')[0])
    expect(container.querySelector('.ui-data-table__edit-input')).toBeNull()
  })
})

describe('DataTable — keyboard grid navigation', () => {
  it('arrow keys move focus across header and body cells, clamped at the edges; Enter on a header sorts', async () => {
    const onSort = vi.fn()
    const { container } = render(Table, { props: { data: ROWS.slice(0, 2), columns: COLS, selectable: true, onSort } })
    const grid = container.querySelector<HTMLElement>('[role="grid"]')!
    const cells = (r: number) => q(grid.querySelectorAll('tr')[r], '[role="columnheader"], [role="gridcell"]')
    cells(1)[0].focus()
    await fireEvent.keyDown(grid, { key: 'ArrowRight' })
    expect(document.activeElement).toBe(cells(1)[1])
    await fireEvent.keyDown(grid, { key: 'ArrowDown' })
    await fireEvent.keyDown(grid, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(cells(2)[1])
    await fireEvent.keyDown(grid, { key: 'ArrowUp' })
    await fireEvent.keyDown(grid, { key: 'ArrowUp' })
    await fireEvent.keyDown(grid, { key: 'ArrowRight' })
    expect(document.activeElement).toBe(cells(0)[2])
    await fireEvent.keyDown(grid, { key: 'Enter' })
    expect(onSort).toHaveBeenLastCalledWith([{ column: 'team', direction: 'asc' }])
    await fireEvent.keyDown(grid, { key: 'ArrowLeft' })
    await fireEvent.keyDown(grid, { key: 'ArrowLeft' })
    await fireEvent.keyDown(grid, { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(cells(0)[0])
  })
})

describe('DataTable — resize and reorder', () => {
  it('dragging a resize handle sets the width, never below minWidth; a double click clears it', async () => {
    const { container } = render(Table, { props: { data: ROWS, columns: [{ ...COLS[0], minWidth: 50 }, COLS[1]], resizable: true } })
    const handle = th(container, 'Name').querySelector<HTMLElement>('.ui-data-table__resize-handle')!
    await fireEvent.pointerDown(handle, { clientX: 100, pointerId: 1 })
    expect(handle.hasAttribute('data-resizing')).toBe(true)
    await fireEvent.pointerMove(handle, { clientX: 230 })
    expect(th(container, 'Name').style.getPropertyValue('inline-size')).toBe('130px')
    expect(q(container, 'td[data-label="Name"]')[0].style.getPropertyValue('inline-size')).toBe('130px')
    await fireEvent.pointerMove(handle, { clientX: 110 })
    expect(th(container, 'Name').style.getPropertyValue('inline-size')).toBe('50px')
    await fireEvent.pointerUp(handle)
    expect(handle.hasAttribute('data-resizing')).toBe(false)
    await fireEvent.pointerMove(handle, { clientX: 400 })
    expect(th(container, 'Name').style.getPropertyValue('inline-size')).toBe('50px')
    await fireEvent.dblClick(handle)
    expect(th(container, 'Name').style.getPropertyValue('inline-size')).toBe('')
  })

  it('dragging a header onto the right half of another moves it after that column', async () => {
    const { container } = render(Table, { props: { data: ROWS, columns: COLS, reorderable: true } })
    const dataTransfer = { setData: vi.fn(), effectAllowed: '', dropEffect: '' }
    expect(th(container, 'Name').getAttribute('draggable')).toBe('true')
    await fireEvent.dragStart(th(container, 'Name'), { dataTransfer })
    expect(dataTransfer.setData).toHaveBeenCalledWith('text/plain', 'name')
    expect(th(container, 'Name').hasAttribute('data-dragging')).toBe(true)
    await dragOver(th(container, 'Score'), dataTransfer, 10)
    expect(th(container, 'Score').getAttribute('data-drag-over')).toBe('right')
    await fireEvent.dragLeave(th(container, 'Score'))
    expect(th(container, 'Score').hasAttribute('data-drag-over')).toBe(false)
    await dragOver(th(container, 'Team'), dataTransfer, -10)
    expect(th(container, 'Team').getAttribute('data-drag-over')).toBe('left')
    await fireEvent.drop(th(container, 'Team'), { dataTransfer })
    expect(q(container, 'th.ui-data-table__th').map(h => h.textContent?.trim())).toEqual(['Name', 'Team', 'Score'])
    await fireEvent.dragStart(th(container, 'Name'), { dataTransfer })
    await dragOver(th(container, 'Score'), dataTransfer, 10)
    await fireEvent.drop(th(container, 'Score'), { dataTransfer })
    expect(q(container, 'th.ui-data-table__th').map(h => h.textContent?.trim())).toEqual(['Team', 'Score', 'Name'])
    expect(container.querySelector('[data-dragging], [data-drag-over]')).toBeNull()
  })
})

/* jsdom has no DragEvent, so testing-library's dragover drops clientX; build
 * the event by hand. A zero-size header has its midpoint at 0. */
async function dragOver(el: HTMLElement, dataTransfer: object, clientX: number) {
  const ev = Object.assign(new Event('dragover', { bubbles: true, cancelable: true }), { dataTransfer, clientX })
  el.dispatchEvent(ev)
  flushSync()
}

describe('DataTable — virtual scroll', () => {
  it('renders the rows in view plus a buffer, and follows scrolling on the next frame', async () => {
    vi.useFakeTimers()
    const { container } = render(Table, { props: { data: MANY, columns: COLS, virtualScroll: true, rowHeight: 30 } })
    const scroller = container.querySelector<HTMLElement>('[data-testid="virtual-scroll-container"]')!
    expect(names(container)).toHaveLength(40)
    expect(container.querySelector<HTMLElement>('.ui-data-table__virtual-spacer')!.style.getPropertyValue('height')).toBe('2850px')
    scroller.scrollTop = 900
    await fireEvent.scroll(scroller)
    vi.advanceTimersToNextFrame()
    flushSync()
    expect(names(container)[0]).toBe('Row 20')
    expect(names(container)).toHaveLength(40)
    expect(rowStyle(container)).toBe('30px')
    expect((container.querySelector('.ui-data-table__virtual-spacer')!.firstElementChild as HTMLElement).style.getPropertyValue('transform')).toBe('translateY(600px)')
  })
})
const rowStyle = (c: ParentNode) => (c.querySelector('tbody tr.ui-data-table__tr') as HTMLElement).style.getPropertyValue('height')

describe('DataTable — server side', () => {
  it('asks for data on mount and on every page, sort and debounced search change, without slicing rows', async () => {
    vi.useFakeTimers()
    const onFetchData = vi.fn()
    const { container } = render(Table, { props: { data: MANY.slice(0, 10), columns: COLS, paginated: true, serverSide: true, totalRows: 95, searchable: true, onFetchData } })
    flushSync()
    expect(onFetchData).toHaveBeenLastCalledWith({ page: 0, pageSize: 10, sortBy: [], filters: {}, search: '' })
    await fireEvent.click(container.querySelector<HTMLElement>('[aria-label="Next page"]')!)
    expect(onFetchData).toHaveBeenLastCalledWith({ page: 1, pageSize: 10, sortBy: [], filters: {}, search: '' })
    expect(names(container)).toHaveLength(10)
    await fireEvent.click(th(container, 'Name'))
    await fireEvent.click(th(container, 'Name'))
    expect(onFetchData).toHaveBeenLastCalledWith({ page: 1, pageSize: 10, sortBy: [{ column: 'name', direction: 'desc' }], filters: {}, search: '' })
    expect(names(container)[0]).toBe('Row 0')
    await fireEvent.input(container.querySelector('input[type="search"]')!, { target: { value: 'zz' } })
    vi.advanceTimersByTime(300)
    flushSync()
    expect(onFetchData).toHaveBeenLastCalledWith({ page: 0, pageSize: 10, sortBy: [{ column: 'name', direction: 'desc' }], filters: {}, search: 'zz' })
    expect(names(container)).toHaveLength(10)
  })
})

describe('DataTable — auto-size, states, CSP', () => {
  it('auto-sizes columns from measured header and cell text, without writing cssText', async () => {
    const cssText = vi.spyOn(CSSStyleDeclaration.prototype, 'cssText', 'set')
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (this: HTMLElement) { return (this.textContent ?? '').length * 10 })
    const { container } = render(Table, { props: { data: ROWS, columns: [COLS[0], { ...COLS[1], autoSize: false }], autoSizeColumns: true } })
    flushSync()
    expect(th(container, 'Name').style.getPropertyValue('inline-size')).toBe('102px')
    expect(th(container, 'Team').style.getPropertyValue('inline-size')).toBe('')
    expect(cssText).not.toHaveBeenCalled()
    expect(document.body.querySelector(':scope > span')).toBeNull()
  })

  it('sets the toolbar spacer\'s flex through setProperty (jsdom cannot parse it, so the contract cannot see it)', () => {
    const set = vi.spyOn(CSSStyleDeclaration.prototype, 'setProperty')
    render(Table, { props: { data: ROWS, columns: COLS } })
    expect(set).toHaveBeenCalledWith('flex', '1 1 0')
  })

  it('Retry calls onRetry', async () => {
    const onRetry = vi.fn()
    const { container } = render(Table, { props: { data: ROWS, columns: COLS, error: 'x', onRetry } })
    await fireEvent.click(container.querySelector<HTMLElement>('.ui-data-table__retry-btn')!)
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('never writes cssText through a run of every interaction that styles', async () => {
    const cssText = vi.spyOn(CSSStyleDeclaration.prototype, 'cssText', 'set')
    const { container } = render(Table, { props: { data: MANY, columns: [{ ...COLS[0], pinned: 'left' as const, width: 90 }, COLS[1]], resizable: true, filterable: true, virtualScroll: true, loading: false } })
    await fireEvent.click(th(container, 'Team').querySelector('.ui-data-table__filter-btn')!)
    const handle = th(container, 'Team').querySelector<HTMLElement>('.ui-data-table__resize-handle')!
    await fireEvent.pointerDown(handle, { clientX: 0, pointerId: 1 })
    await fireEvent.pointerMove(handle, { clientX: 200 })
    expect(cssText).not.toHaveBeenCalled()
  })
})

/* lib/data-table.ts and lib/data-table-ai.ts copy React's pure logic; a React
 * fix must not silently skip Svelte. */
describe('DataTable helpers — drift from React', () => {
  const read = (p: string) => readFileSync(resolve(import.meta.dirname, p), 'utf8')
  const react = read('../../../../src/domain/data-table.tsx')
  const ours = read('../../src/lib/data-table.ts')
  const fn = (src: string, name: string) => {
    const start = src.search(new RegExp(`(?:export )?function ${name}[<(]`))
    if (start < 0) throw new Error(`${name} not found`)
    return src.slice(start, src.indexOf('\n}\n', start) + 2).replace(/^export /, '').replace(/\s+/g, ' ')
  }
  for (const name of ['getCellValue', 'getHeaderText', 'toCSV', 'toJSON', 'downloadFile', 'compareValues', 'applyFilter', 'getOperatorsForType', 'computeAggregation']) {
    it(`${name} matches React's`, () => expect(fn(ours, name)).toBe(fn(react, name)))
  }
  it('the row-height constants and FilterOperator match React\'s', () => {
    for (const line of ['const DEFAULT_ROW_HEIGHT = 40', 'const BUFFER_ROWS = 10', react.match(/^type FilterOperator = .*$/m)![0]]) {
      expect(react).toContain(line)
      expect(ours).toContain(line)
    }
  })
  it('data-table-ai.ts is React\'s file, import aside', () => {
    const body = (src: string) => src.replace(/^\/\*[\s\S]*?\*\/\n/, '').replace(/^import type \{ ColumnDef \} from '[^']+'\n/m, '')
    expect(body(read('../../src/lib/data-table-ai.ts'))).toBe(body(read('../../../../src/domain/data-table-ai.ts')))
  })
})
