<script lang="ts" generics="T extends object">
  import { untrack, type Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'
  import { cssProps } from '../actions/css-props.js'
  import { portal } from '../actions/portal.js'
  import { reactSelectFallback } from '../actions/react-select.js'
  import { mergeStyles, reactStyle, type StyleInput, type StyleObject } from '../lib/react-style.js'
  import Content from '../lib/Content.svelte'
  import DataTableSuggestions from './DataTableSuggestions.svelte'
  import { analyzeData } from '../lib/data-table-ai.js'
  import {
    getCellValue, getHeaderText, toCSV, toJSON, downloadFile, compareValues, applyFilter, getOperatorsForType,
    computeAggregation, DEFAULT_ROW_HEIGHT, BUFFER_ROWS, type ColumnDef, type SortEntry, type ColumnFilter,
  } from '../lib/data-table.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  type Filters = Record<string, ColumnFilter>
  type Aggregation = 'sum' | 'avg' | 'count' | 'min' | 'max'

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'style'> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    data: T[]
    columns: ColumnDef<T>[]
    searchable?: boolean
    sortable?: boolean
    paginated?: boolean
    pageSize?: number
    pageSizes?: number[]
    selectable?: boolean
    resizable?: boolean
    reorderable?: boolean
    exportable?: boolean
    virtualScroll?: boolean
    stickyHeader?: boolean
    /** Bindable. Omit it and the table keeps its own sort. */
    sortBy?: SortEntry[]
    onSort?: (sort: SortEntry[]) => void
    /** Bindable. Indices into the sorted, filtered, unpaginated rows, as in React. */
    selectedRows?: Set<number>
    onSelectionChange?: (selected: Set<number>) => void
    onExport?: (format: 'csv' | 'json', data: T[]) => void
    onPageChange?: (page: number) => void
    onSearchChange?: (query: string) => void
    loading?: boolean
    empty?: string | Snippet
    error?: string | Snippet
    onRetry?: () => void
    striped?: boolean
    compact?: boolean
    bordered?: boolean
    responsiveMode?: 'scroll' | 'card'
    toolbar?: string | Snippet
    motion?: MotionLevel
    rowHeight?: number
    filterable?: boolean
    /** Bindable. */
    filters?: Filters
    onFilterChange?: (filters: Filters) => void
    groupBy?: string
    aggregations?: Record<string, Aggregation>
    /** Bindable. */
    expandedGroups?: Set<string>
    onGroupToggle?: (groupKey: string) => void
    editable?: boolean
    onCellEdit?: (rowIndex: number, columnId: string, value: unknown) => void
    serverSide?: boolean
    totalRows?: number
    onFetchData?: (params: { page: number; pageSize: number; sortBy: SortEntry[]; filters: Filters; search: string }) => void
    autoSizeColumns?: boolean
    showSuggestions?: boolean
    style?: StyleInput
    class?: string
  }

  let {
    data, columns, searchable = false, sortable = true, paginated = false, pageSize: pageSizeProp = 10,
    pageSizes = [10, 25, 50, 100], selectable = false, resizable = false, reorderable = false, exportable = false,
    virtualScroll = false, stickyHeader = true, sortBy = $bindable([]), onSort, selectedRows = $bindable(new Set()),
    onSelectionChange, onExport, onPageChange, onSearchChange, loading = false, empty, error, onRetry, striped = false,
    compact = false, bordered = false, responsiveMode = 'scroll', toolbar, motion, rowHeight: rowHeightProp,
    filterable = false, filters = $bindable({}), onFilterChange, groupBy, aggregations, expandedGroups = $bindable(new Set()),
    onGroupToggle, editable = false, onCellEdit, serverSide = false, totalRows, onFetchData, autoSizeColumns = false,
    showSuggestions = false, class: className, style, ref = $bindable(null), ...rest
  }: Props = $props()

  const cls = makeCls('data-table')
  const motionLevel = getMotionLevel(() => motion)
  const styles = $derived(mergeStyles(style))

  /* Every bindable value is written, then reported: the package's form-value
   * rule (README). React instead hands the change to the callback alone when one
   * is passed, so a callback without the value leaves its state unchanged. */
  const setSortBy = (next: SortEntry[]) => { sortBy = next; onSort?.(next) }
  const setSelectedRows = (next: Set<number>) => { selectedRows = next; onSelectionChange?.(next) }
  const setFilters = (next: Filters) => { filters = next; onFilterChange?.(next) }

  // ─── AI suggestions ─────────────────────────────────────────────────
  const aiInsights = $derived(showSuggestions ? analyzeData(data, columns as never) : [])

  // ─── Search (debounced 300ms) ───────────────────────────────────────
  let searchQuery = $state('')
  let debouncedSearch = $state('')
  $effect(() => {
    const value = searchQuery
    const timer = setTimeout(() => { debouncedSearch = value }, 300)
    return () => clearTimeout(timer)
  })
  function handleSearchInput(e: Event) {
    searchQuery = (e.currentTarget as HTMLInputElement).value
    onSearchChange?.(searchQuery)
  }
  function clearSearch() {
    searchQuery = ''
    onSearchChange?.('')
  }

  // ─── Column visibility and order ────────────────────────────────────
  // svelte-ignore state_referenced_locally
  let hiddenColumns = $state(new Set<string>(columns.filter(c => c.hidden).map(c => c.id)))
  let showColDropdown = $state(false)
  let colDropdownEl = $state<HTMLDivElement | null>(null)
  $effect(() => {
    if (!showColDropdown) return
    const handler = (e: MouseEvent) => {
      if (colDropdownEl && !colDropdownEl.contains(e.target as Node)) showColDropdown = false
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  })
  function toggleColumn(colId: string) {
    const next = new Set(hiddenColumns)
    if (next.has(colId)) next.delete(colId)
    else next.add(colId)
    hiddenColumns = next
  }

  // svelte-ignore state_referenced_locally
  let columnOrder = $state(columns.map(c => c.id))
  // Keep the order of known columns when `columns` changes; append new ones.
  $effect(() => {
    const cols = columns
    untrack(() => {
      const propIds = new Set(cols.map(c => c.id))
      const kept = columnOrder.filter(id => propIds.has(id))
      columnOrder = [...kept, ...cols.filter(c => !kept.includes(c.id)).map(c => c.id)]
    })
  })

  let dragColId = $state<string | null>(null)
  let dragOverColId = $state<string | null>(null)
  let dragOverSide = $state<'left' | 'right' | null>(null)
  function handleDragStart(colId: string, e: DragEvent) {
    if (!reorderable) return
    dragColId = colId
    e.dataTransfer!.effectAllowed = 'move'
    e.dataTransfer!.setData('text/plain', colId)
  }
  function handleDragOver(colId: string, e: DragEvent) {
    if (!reorderable || !dragColId || dragColId === colId) return
    e.preventDefault()
    e.dataTransfer!.dropEffect = 'move'
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    dragOverColId = colId
    dragOverSide = e.clientX < rect.left + rect.width / 2 ? 'left' : 'right'
  }
  function handleDrop(targetColId: string, e: DragEvent) {
    e.preventDefault()
    if (!dragColId || dragColId === targetColId) return
    const next = columnOrder.filter(id => id !== dragColId)
    let targetIdx = next.indexOf(targetColId)
    if (dragOverSide === 'right') targetIdx++
    next.splice(targetIdx, 0, dragColId)
    columnOrder = next
    dragColId = dragOverColId = dragOverSide = null
  }
  const handleDragEnd = () => { dragColId = dragOverColId = dragOverSide = null }

  const visibleColumns = $derived.by(() => {
    const colMap = new Map(columns.map(c => [c.id, c]))
    return columnOrder.filter(id => !hiddenColumns.has(id) && colMap.has(id)).map(id => colMap.get(id)!)
  })

  // ─── Sort ───────────────────────────────────────────────────────────
  function handleSort(colId: string, shiftKey: boolean) {
    const col = columns.find(c => c.id === colId)
    if (!col || !(col.sortable ?? sortable)) return
    const prev = sortBy
    const existing = prev.find(s => s.column === colId)
    let next: SortEntry[]
    if (shiftKey) {
      if (existing) next = existing.direction === 'asc' ? prev.map(s => (s.column === colId ? { ...s, direction: 'desc' as const } : s)) : prev.filter(s => s.column !== colId)
      else next = [...prev, { column: colId, direction: 'asc' }]
    } else if (existing) {
      next = existing.direction === 'asc' ? [{ column: colId, direction: 'desc' }] : []
    } else {
      next = [{ column: colId, direction: 'asc' }]
    }
    setSortBy(next)
  }

  // ─── Column filters ─────────────────────────────────────────────────
  let openFilterCol = $state<string | null>(null)
  let filterBtnRect = $state<{ top: number; left: number; bottom: number } | null>(null)
  const closeFilter = () => { openFilterCol = null }
  function clearFilter(colId: string) {
    const next = { ...filters }
    delete next[colId]
    setFilters(next)
    openFilterCol = null
  }

  // ─── Cell editing ───────────────────────────────────────────────────
  let editingCell = $state<{ row: number; col: string } | null>(null)
  let editValue = $state('')
  let justEditedCell = $state<{ row: number; col: string } | null>(null)
  let justEditedTimer: ReturnType<typeof setTimeout> | undefined
  $effect(() => () => clearTimeout(justEditedTimer))
  function startEditing(rowIndex: number, colId: string, currentValue: unknown) {
    if (!editable) return
    const col = columns.find(c => c.id === colId)
    if (col && col.editable === false) return
    editingCell = { row: rowIndex, col: colId }
    editValue = String(currentValue ?? '')
  }
  function commitEdit() {
    if (!editingCell) return
    const cell = editingCell
    onCellEdit?.(cell.row, cell.col, editValue)
    columns.find(c => c.id === cell.col)?.onCellEdit?.(cell.row, editValue)
    justEditedCell = { ...cell }
    editingCell = null
    clearTimeout(justEditedTimer)
    justEditedTimer = setTimeout(() => { justEditedCell = null }, 600)
  }
  const cancelEdit = () => { editingCell = null }

  // ─── Row grouping ───────────────────────────────────────────────────
  function toggleGroup(groupKey: string) {
    const next = new Set(expandedGroups)
    if (next.has(groupKey)) next.delete(groupKey)
    else next.add(groupKey)
    expandedGroups = next
    onGroupToggle?.(groupKey)
  }

  // ─── Column widths: initial, resize, auto-size ──────────────────────
  // svelte-ignore state_referenced_locally
  let columnWidths = $state<Record<string, number>>(Object.fromEntries(columns.filter(c => typeof c.width === 'number').map(c => [c.id, c.width as number])))
  let autoSized = false
  $effect(() => {
    if (!autoSizeColumns || autoSized) return
    autoSized = true
    const cols = columns
    const rows = data
    untrack(() => {
      // An off-screen measuring element, styled property by property (CSP: never cssText).
      const measure = document.createElement('span')
      for (const [k, v] of [['position', 'absolute'], ['visibility', 'hidden'], ['white-space', 'nowrap'], ['font', 'inherit']]) measure.style.setProperty(k, v)
      document.body.appendChild(measure)
      const widths: Record<string, number> = {}
      for (const col of cols) {
        if (col.autoSize === false) continue
        measure.textContent = getHeaderText(col.header, col.id)
        let maxW = measure.offsetWidth
        for (const row of rows.slice(0, 100)) {
          measure.textContent = String(getCellValue(row, col.accessor) ?? '')
          maxW = Math.max(maxW, measure.offsetWidth)
        }
        widths[col.id] = maxW + 32 // padding
      }
      document.body.removeChild(measure)
      columnWidths = { ...columnWidths, ...widths }
    })
  })

  let resizing: { colId: string; startX: number; startWidth: number } | null = null
  function handleResizeStart(colId: string, e: PointerEvent) {
    e.preventDefault()
    e.stopPropagation()
    const target = e.target as HTMLElement
    const startWidth = columnWidths[colId] ?? target.parentElement!.getBoundingClientRect().width
    resizing = { colId, startX: e.clientX, startWidth }
    target.setPointerCapture(e.pointerId)
    target.setAttribute('data-resizing', '')
  }
  function handleResizeMove(e: PointerEvent) {
    if (!resizing) return
    const { colId, startX, startWidth } = resizing
    const minW = columns.find(c => c.id === colId)?.minWidth ?? 80
    columnWidths = { ...columnWidths, [colId]: Math.max(minW, startWidth + (e.clientX - startX)) }
  }
  function handleResizeEnd(e: PointerEvent) {
    resizing = null
    ;(e.target as HTMLElement).removeAttribute('data-resizing')
  }
  function handleResizeDoubleClick(colId: string) {
    const next = { ...columnWidths }
    delete next[colId]
    columnWidths = next
  }

  // ─── Data pipeline: search → column filters → sort → group → paginate → virtual slice
  const searchFilteredData = $derived.by(() => {
    if (serverSide || !searchable || !debouncedSearch) return data
    const q = debouncedSearch.toLowerCase()
    return data.filter(row => columns.some(col => col.searchable !== false && String(getCellValue(row, col.accessor) ?? '').toLowerCase().includes(q)))
  })
  const filteredData = $derived.by(() => {
    if (serverSide) return searchFilteredData
    const filterKeys = Object.keys(filters)
    if (filterKeys.length === 0) return searchFilteredData
    return searchFilteredData.filter(row => filterKeys.every(colId => {
      const col = columns.find(c => c.id === colId)
      if (!col) return true
      const filter = filters[colId]
      if (!filter || (!filter.value && filter.operator !== 'isEmpty' && filter.operator !== 'isNotEmpty')) return true
      return applyFilter(getCellValue(row, col.accessor), filter)
    }))
  })
  const sortedData = $derived.by(() => {
    if (serverSide || sortBy.length === 0) return filteredData
    return [...filteredData].sort((a, b) => {
      for (const { column, direction } of sortBy) {
        const col = columns.find(c => c.id === column)
        if (!col) continue
        const cmp = compareValues(getCellValue(a, col.accessor), getCellValue(b, col.accessor), direction)
        if (cmp !== 0) return cmp
      }
      return 0
    })
  })
  const groupedData = $derived.by(() => {
    if (!groupBy || serverSide) return null
    const groupCol = columns.find(c => c.id === groupBy)
    if (!groupCol) return null
    const groups = new Map<string, { rows: T[]; key: string }>()
    for (const row of sortedData) {
      const val = String(getCellValue(row, groupCol.accessor) ?? '')
      if (!groups.has(val)) groups.set(val, { rows: [], key: val })
      groups.get(val)!.rows.push(row)
    }
    return groups
  })

  // ─── Pagination ─────────────────────────────────────────────────────
  let page = $state(0)
  // svelte-ignore state_referenced_locally
  let pageSize = $state(pageSizeProp)
  let showAllPages = $state(false)
  /* React's dependency arrays compare these by value. A derived does too, so a
   * new array of the same length (or a parent re-spreading its props) does not
   * re-run the effects below; reading the props directly would. */
  const dataLength = $derived(data.length)
  const pageSizeValue = $derived(pageSizeProp)
  $effect(() => {
    void debouncedSearch
    void dataLength
    untrack(() => { page = 0 })
  })
  $effect(() => {
    const size = pageSizeValue
    untrack(() => { pageSize = size })
  })
  const dataCount = $derived(serverSide ? (totalRows ?? data.length) : sortedData.length)
  const totalPages = $derived(paginated ? Math.max(1, Math.ceil(dataCount / (showAllPages ? dataCount : pageSize))) : 1)
  const paginatedData = $derived(paginated && !showAllPages && !serverSide ? sortedData.slice(page * pageSize, (page + 1) * pageSize) : sortedData)
  function handlePageChange(newPage: number) {
    page = newPage
    onPageChange?.(newPage)
  }
  function handlePageSizeChange(e: Event) {
    const val = (e.currentTarget as HTMLSelectElement).value
    if (val === 'all') showAllPages = true
    else { showAllPages = false; pageSize = Number(val) }
    page = 0
  }
  const paginationRange = $derived.by(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i as number | 'ellipsis')
    const pages: (number | 'ellipsis')[] = [0]
    if (page > 2) pages.push('ellipsis')
    for (let i = Math.max(1, page - 1); i <= Math.min(totalPages - 2, page + 1); i++) pages.push(i)
    if (page < totalPages - 3) pages.push('ellipsis')
    pages.push(totalPages - 1)
    return pages
  })
  const pageInfoText = $derived.by(() => {
    if (!paginated) return null
    if (dataCount === 0) return 'No results'
    if (showAllPages) return `Showing all ${dataCount} results`
    return `Showing ${page * pageSize + 1}–${Math.min((page + 1) * pageSize, dataCount)} of ${dataCount} results`
  })

  // ─── Selection ──────────────────────────────────────────────────────
  function handleRowSelect(globalIdx: number) {
    const next = new Set(selectedRows)
    if (next.has(globalIdx)) next.delete(globalIdx)
    else next.add(globalIdx)
    setSelectedRows(next)
  }
  const allSelected = $derived(selectedRows.size === paginatedData.length && paginatedData.length > 0)
  const someSelected = $derived(selectedRows.size > 0 && !allSelected)
  function handleSelectAll() {
    if (allSelected) setSelectedRows(new Set())
    else {
      // The visible rows, by their index in the sorted data.
      const base = paginated && !showAllPages ? page * pageSize : 0
      setSelectedRows(new Set(paginatedData.map((_, i) => base + i)))
    }
  }
  let selectAllEl = $state<HTMLInputElement | null>(null)
  $effect(() => { if (selectAllEl) selectAllEl.indeterminate = someSelected })

  // ─── Export ─────────────────────────────────────────────────────────
  let showExportDropdown = $state(false)
  let exportDropdownEl = $state<HTMLDivElement | null>(null)
  $effect(() => {
    if (!showExportDropdown) return
    const handler = (e: MouseEvent) => {
      if (exportDropdownEl && !exportDropdownEl.contains(e.target as Node)) showExportDropdown = false
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  })
  function handleExport(format: 'csv' | 'json') {
    showExportDropdown = false
    if (onExport) { onExport(format, sortedData); return }
    if (format === 'csv') downloadFile(toCSV(sortedData, visibleColumns), 'export.csv', 'text/csv')
    else downloadFile(toJSON(sortedData, visibleColumns), 'export.json', 'application/json')
  }

  // ─── Server-side fetch ──────────────────────────────────────────────
  $effect(() => {
    if (!serverSide || !onFetchData) return
    const params = { page, pageSize, sortBy, filters, search: debouncedSearch }
    const fetch = onFetchData
    untrack(() => fetch(params))
  })

  // ─── Virtual scroll ─────────────────────────────────────────────────
  const rowHeight = $derived(rowHeightProp ?? DEFAULT_ROW_HEIGHT)
  const virtualOn = $derived(virtualScroll && !paginated)
  let virtualEl = $state<HTMLDivElement | null>(null)
  let scrollTop = $state(0)
  let containerHeight = $state(600)
  $effect(() => {
    const container = virtualEl
    if (!virtualOn || !container) return
    let raf = 0
    const onScroll = () => {
      if (raf) cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => { scrollTop = container.scrollTop })
    }
    const observer = new ResizeObserver(entries => { for (const entry of entries) containerHeight = entry.contentRect.height })
    container.addEventListener('scroll', onScroll, { passive: true })
    observer.observe(container)
    return () => {
      container.removeEventListener('scroll', onScroll)
      observer.disconnect()
      if (raf) cancelAnimationFrame(raf)
    }
  })
  const virtual = $derived.by(() => {
    const total = paginatedData.length
    if (!virtualOn) return { totalHeight: 0, offsetY: 0, startIndex: 0, endIndex: total }
    const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - BUFFER_ROWS)
    const endIndex = Math.min(total, startIndex + Math.ceil(containerHeight / rowHeight) + BUFFER_ROWS * 2)
    return { totalHeight: total * rowHeight, offsetY: startIndex * rowHeight, startIndex, endIndex }
  })
  const displayData = $derived(virtualOn ? paginatedData.slice(virtual.startIndex, virtual.endIndex) : paginatedData)

  // ─── Keyboard grid navigation ───────────────────────────────────────
  let gridEl = $state<HTMLTableElement | null>(null)
  const CELLS = '[role="columnheader"], [role="gridcell"]'
  function handleKeyDown(e: KeyboardEvent) {
    const grid = gridEl
    const active = document.activeElement as HTMLElement | null
    if (!grid || !active) return
    const allRows = Array.from(grid.querySelectorAll('tr'))
    let rowIdx = -1
    let colIdx = -1
    for (let r = 0; r < allRows.length; r++) {
      const idx = Array.from(allRows[r].querySelectorAll(CELLS)).indexOf(active)
      if (idx !== -1) { rowIdx = r; colIdx = idx; break }
    }
    if (rowIdx === -1 || colIdx === -1) return
    let nextRow = rowIdx
    let nextCol = colIdx
    switch (e.key) {
      case 'ArrowDown': nextRow = Math.min(rowIdx + 1, allRows.length - 1); e.preventDefault(); break
      case 'ArrowUp': nextRow = Math.max(rowIdx - 1, 0); e.preventDefault(); break
      case 'ArrowRight': nextCol = Math.min(colIdx + 1, allRows[rowIdx].querySelectorAll(CELLS).length - 1); e.preventDefault(); break
      case 'ArrowLeft': nextCol = Math.max(colIdx - 1, 0); e.preventDefault(); break
      case 'Enter': {
        if (rowIdx === 0) {
          const col = visibleColumns[selectable ? colIdx - 1 : colIdx]
          if (col && (col.sortable ?? sortable)) handleSort(col.id, e.shiftKey)
        }
        return
      }
      default: return
    }
    const targetRow = allRows[nextRow]
    if (!targetRow) return
    ;(Array.from(targetRow.querySelectorAll(CELLS))[nextCol] as HTMLElement | undefined)?.focus()
  }

  // ─── Per-column presentation ────────────────────────────────────────
  function ariaSort(col: ColumnDef<T>): 'none' | 'ascending' | 'descending' | undefined {
    if (!(col.sortable ?? sortable)) return undefined
    const entry = sortBy.find(s => s.column === col.id)
    if (!entry) return 'none'
    return entry.direction === 'asc' ? 'ascending' : 'descending'
  }
  const widthOf = (col: ColumnDef<T>) => columnWidths[col.id] ?? (typeof col.width === 'number' ? col.width : 150)
  const pinnedOffsets = $derived.by(() => {
    const offsets: Record<string, number> = {}
    let left = 0
    for (const col of visibleColumns) if (col.pinned === 'left') { offsets[col.id] = left; left += widthOf(col) }
    let right = 0
    for (const col of [...visibleColumns].reverse()) if (col.pinned === 'right') { offsets[col.id] = right; right += widthOf(col) }
    return offsets
  })
  const lastLeftPinned = $derived(visibleColumns.filter(c => c.pinned === 'left').at(-1)?.id ?? '')
  const firstRightPinned = $derived(visibleColumns.find(c => c.pinned === 'right')?.id ?? '')
  function colStyle(col: ColumnDef<T>): Record<string, string> {
    const w = columnWidths[col.id] ?? col.width
    const s: StyleObject = {}
    if (w) s.inlineSize = typeof w === 'number' ? `${w}px` : w
    if (col.pinned === 'left' && pinnedOffsets[col.id] !== undefined) s.left = `${pinnedOffsets[col.id]}px`
    if (col.pinned === 'right' && pinnedOffsets[col.id] !== undefined) s.right = `${pinnedOffsets[col.id]}px`
    return reactStyle(s)
  }
  const pinnedShadow = (col: ColumnDef<T>) => (col.id === lastLeftPinned ? 'left' : col.id === firstRightPinned ? 'right' : undefined)
  const hasActiveFilter = (colId: string) => {
    const f = filters[colId]
    return !!f && (!!f.value || f.operator === 'isEmpty' || f.operator === 'isNotEmpty')
  }
  const colspan = $derived(visibleColumns.length + (selectable ? 1 : 0))
  const activate = (fn: () => void) => fn
</script>

{#snippet highlighted(text: string)}
  {@const idx = debouncedSearch ? text.toLowerCase().indexOf(debouncedSearch.toLowerCase()) : -1}
  {#if idx === -1}{text}{:else}{text.slice(0, idx)}<mark class="ui-data-table__search-highlight">{text.slice(idx, idx + debouncedSearch.length)}</mark>{text.slice(idx + debouncedSearch.length)}{/if}
{/snippet}

{#snippet filterPopover(col: ColumnDef<T>)}
  {@const operators = getOperatorsForType(col.filterType)}
  {#if col.filterType === 'select'}
    {@const selected = (filters[col.id]?.value ?? '').split(',').map(v => v.trim().toLowerCase())}
    <div class="ui-data-table__filter-select-list">
      {#each col.filterOptions ?? [...new Set(data.map(r => String(getCellValue(r, col.accessor) ?? '')))] as opt}
        {@const isChecked = selected.includes(opt.toLowerCase())}
        <label class="ui-data-table__filter-select-item">
          <input
            type="checkbox"
            checked={isChecked}
            onchange={() => {
              let vals = selected.filter(v => v !== '')
              if (isChecked) vals = vals.filter(v => v !== opt.toLowerCase())
              else vals.push(opt.toLowerCase())
              setFilters({ ...filters, [col.id]: { value: vals.join(','), operator: 'isOneOf' } })
            }}
          />{opt}
        </label>
      {/each}
    </div>
    <div class="ui-data-table__filter-actions"><button type="button" onclick={() => clearFilter(col.id)}>Clear</button></div>
  {:else}
    <select
      value={filters[col.id]?.operator ?? operators[0].value}
      use:reactSelectFallback={[filters[col.id]?.operator, operators]}
      onchange={e => setFilters({ ...filters, [col.id]: { value: filters[col.id]?.value ?? '', operator: e.currentTarget.value } })}
      data-testid={`filter-operator-${col.id}`}
    >
      {#each operators as op}<option value={op.value}>{op.label}</option>{/each}
    </select>
    <input
      type={col.filterType === 'number' ? 'number' : col.filterType === 'date' ? 'date' : 'text'}
      placeholder="Filter value..."
      value={filters[col.id]?.value ?? ''}
      oninput={e => setFilters({ ...filters, [col.id]: { value: e.currentTarget.value, operator: filters[col.id]?.operator ?? operators[0].value } })}
      data-testid={`filter-input-${col.id}`}
    />
    <div class="ui-data-table__filter-actions">
      <button type="button" onclick={() => clearFilter(col.id)}>Clear</button>
      <button type="button" onclick={closeFilter}>Apply</button>
    </div>
  {/if}
{/snippet}

{#snippet dataRow(row: T, globalIdx: number, isSelected: boolean)}
  <!-- svelte-ignore a11y_no_redundant_roles (as React: explicit grid roles) -->
  <tr
    class="ui-data-table__tr"
    role="row"
    aria-selected={selectable ? isSelected : undefined}
    data-selected={isSelected ? '' : undefined}
    use:cssProps={virtualOn ? { height: `${rowHeight}px` } : {}}
  >
    {#if selectable}
      <td class="ui-data-table__td ui-data-table__checkbox-cell" role="gridcell" tabindex={-1}>
        <input type="checkbox" class="ui-data-table__checkbox" checked={isSelected} onchange={() => handleRowSelect(globalIdx)} aria-label={`Select row ${globalIdx + 1}`} />
      </td>
    {/if}
    {#each visibleColumns as col}
      {@const value = getCellValue(row, col.accessor)}
      {@const isEditing = editingCell?.row === globalIdx && editingCell?.col === col.id}
      {@const isColEditable = editable && col.editable !== false}
      <td
        class="ui-data-table__td"
        role="gridcell"
        tabindex={-1}
        data-align={col.align || undefined}
        data-pinned={col.pinned || undefined}
        data-pinned-shadow={pinnedShadow(col)}
        data-label={getHeaderText(col.header, col.id)}
        data-editing={isEditing ? '' : undefined}
        data-just-edited={justEditedCell?.row === globalIdx && justEditedCell?.col === col.id ? '' : undefined}
        use:cssProps={colStyle(col)}
        ondblclick={isColEditable ? () => startEditing(globalIdx, col.id, value) : undefined}
      >{#if isEditing}<!-- svelte-ignore a11y_autofocus (as React's autoFocus) --><input
            class="ui-data-table__edit-input"
            data-testid={`edit-input-${col.id}`}
            bind:value={editValue}
            onkeydown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') cancelEdit() }}
            onblur={commitEdit}
            autofocus
          />{:else if col.cell}{@render col.cell(value, row, globalIdx)}{:else if searchable && debouncedSearch && col.searchable !== false}{@render highlighted(String(value ?? ''))}{:else}{String(value ?? '')}{/if}</td>
    {/each}
  </tr>
{/snippet}

{#snippet tableContent()}
  <table
    bind:this={gridEl}
    class="ui-data-table__table"
    role="grid"
    aria-rowcount={sortedData.length + 1}
    aria-colcount={colspan}
    onkeydown={handleKeyDown}
  >
    <!-- svelte-ignore a11y_no_redundant_roles (as React: explicit grid roles) -->
    <thead class="ui-data-table__thead" role="rowgroup">
      <!-- svelte-ignore a11y_no_redundant_roles (as React: explicit grid roles) -->
      <tr role="row">
        {#if selectable}
          <th class="ui-data-table__th ui-data-table__checkbox-cell" role="columnheader" scope="col" tabindex={-1}>
            <input bind:this={selectAllEl} type="checkbox" class="ui-data-table__checkbox" checked={allSelected} onchange={handleSelectAll} aria-label="Select all rows" />
          </th>
        {/if}
        {#each visibleColumns as col}
          {@const isColSortable = col.sortable ?? sortable}
          {@const isColFilterable = (filterable || col.filterable) && col.filterable !== false}
          {@const sortIndex = sortBy.findIndex(s => s.column === col.id)}
          <th
            class="ui-data-table__th"
            role="columnheader"
            scope="col"
            tabindex={-1}
            use:cssProps={colStyle(col)}
            aria-sort={ariaSort(col)}
            data-sortable={isColSortable ? '' : undefined}
            data-align={col.align || undefined}
            data-pinned={col.pinned || undefined}
            data-pinned-shadow={pinnedShadow(col)}
            data-reorderable={reorderable ? '' : undefined}
            data-dragging={dragColId === col.id ? '' : undefined}
            data-drag-over={dragOverColId === col.id && dragOverSide ? dragOverSide : undefined}
            draggable={reorderable}
            onclick={e => {
              // A click on the filter button is not a sort.
              if ((e.target as HTMLElement).closest('.ui-data-table__filter-btn')) return
              if (isColSortable) handleSort(col.id, e.shiftKey)
            }}
            ondragstart={e => handleDragStart(col.id, e)}
            ondragover={e => handleDragOver(col.id, e)}
            ondrop={e => handleDrop(col.id, e)}
            ondragend={handleDragEnd}
            ondragleave={() => { if (dragOverColId === col.id) dragOverColId = dragOverSide = null }}
          >
            <span class="ui-data-table__header-content"><Content value={col.header} />{#if isColSortable}<span class="ui-data-table__sort-icon" aria-hidden="true"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2L10 7H2L6 2Z" fill="currentColor" /></svg></span>{/if}{#if sortBy.length > 1 && sortIndex >= 0}<span class="ui-data-table__sort-badge" aria-hidden="true">{sortIndex + 1}</span>{/if}{#if isColFilterable}<button
                  type="button"
                  class="ui-data-table__filter-btn"
                  data-active={hasActiveFilter(col.id) ? '' : undefined}
                  onclick={e => {
                    e.stopPropagation()
                    const rect = e.currentTarget.getBoundingClientRect()
                    filterBtnRect = { top: rect.top, left: rect.left, bottom: rect.bottom }
                    openFilterCol = openFilterCol === col.id ? null : col.id
                  }}
                  aria-label={`Filter ${getHeaderText(col.header, col.id)}`}
                ><svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M1 2h10L7 6.5V10L5 9V6.5L1 2Z" fill="currentColor" /></svg></button>{/if}</span>
            <!-- React portals these two siblings to <body>; each is its own block so Svelte removes each node by itself. -->
            {#if isColFilterable && openFilterCol === col.id}
              <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions (as React: a transparent click-catcher) -->
              <div
                use:portal
                class="ui-data-table__filter-backdrop"
                onclick={e => { e.stopPropagation(); closeFilter() }}
                ontouchend={e => { e.preventDefault(); e.stopPropagation(); closeFilter() }}
              ></div>
            {/if}
            {#if isColFilterable && openFilterCol === col.id}
              <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions (as React) -->
              <div
                use:portal
                class="ui-data-table__filter-popover"
                data-testid={`filter-popover-${col.id}`}
                onclick={e => e.stopPropagation()}
                use:cssProps={filterBtnRect ? reactStyle({ top: filterBtnRect.bottom + 4, left: Math.max(8, filterBtnRect.left) }) : {}}
              >{@render filterPopover(col)}</div>
            {/if}
            {#if col.resizable ?? resizable}
              <span
                class="ui-data-table__resize-handle"
                onpointerdown={e => handleResizeStart(col.id, e)}
                onpointermove={handleResizeMove}
                onpointerup={handleResizeEnd}
                ondblclick={() => handleResizeDoubleClick(col.id)}
                role="separator"
                aria-orientation="vertical"
              ></span>
            {/if}
          </th>
        {/each}
      </tr>
    </thead>
    <!-- svelte-ignore a11y_no_redundant_roles (as React: explicit grid roles) -->
    <tbody class="ui-data-table__tbody" role="rowgroup">
      {#if loading}
        {#each { length: paginated ? pageSize : 5 } as _, ri (ri)}
          <!-- svelte-ignore a11y_no_redundant_roles (as React: explicit grid roles) -->
          <tr class="ui-data-table__skeleton-row" role="row">
            {#if selectable}
              <td class="ui-data-table__skeleton-cell ui-data-table__checkbox-cell" role="gridcell"><span class="ui-data-table__skeleton-bar" use:cssProps={{ 'inline-size': '16px', margin: '0 auto' }}></span></td>
            {/if}
            {#each visibleColumns as col}
              <td class="ui-data-table__skeleton-cell" role="gridcell"><span class="ui-data-table__skeleton-bar" use:cssProps={{ 'inline-size': `${50 + ((ri * 17 + col.id.length * 13) % 40)}%` }}></span></td>
            {/each}
          </tr>
        {/each}
      {:else if displayData.length === 0}
        <!-- svelte-ignore a11y_no_redundant_roles (as React: explicit grid roles) -->
        <tr role="row"><td class="ui-data-table__empty" role="gridcell" {colspan}><Content value={empty ?? 'No data'} /></td></tr>
      {:else if groupedData && groupBy}
        {#each Array.from(groupedData.entries()) as [groupKey, group] (groupKey)}
          {@const isExpanded = expandedGroups.has(groupKey)}
          <!-- svelte-ignore a11y_no_redundant_roles (as React: explicit grid roles) -->
          <tr class="ui-data-table__group-row" role="row" onclick={() => toggleGroup(groupKey)} data-testid={`group-row-${groupKey}`}>
            <td class="ui-data-table__group-cell" role="gridcell" {colspan}><span class="ui-data-table__group-chevron" data-expanded={isExpanded ? '' : undefined} aria-hidden="true"><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3 1L7 5L3 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" /></svg></span>{groupKey}<span class="ui-data-table__group-count">({group.rows.length})</span>{#if aggregations}{#each visibleColumns as col}{#if aggregations[col.id]}<span class="ui-data-table__group-agg" data-testid={`group-agg-${groupKey}-${col.id}`}>{getHeaderText(col.header, col.id)}: {computeAggregation(group.rows.map(r => getCellValue(r, col.accessor)), aggregations[col.id])}</span>{/if}{/each}{/if}</td>
          </tr>
          {#if isExpanded}
            {#each group.rows as row}
              {@const globalIdx = sortedData.indexOf(row)}
              {@render dataRow(row, globalIdx, selectedRows.has(globalIdx))}
            {/each}
          {/if}
        {/each}
      {:else}
        {#each displayData as row, idx}
          {@const globalIdx = (paginated && !showAllPages && !serverSide ? page * pageSize : 0) + (virtualOn ? virtual.startIndex : 0) + idx}
          {@render dataRow(row, globalIdx, selectedRows.has(globalIdx))}
        {/each}
      {/if}
    </tbody>
  </table>
{/snippet}

<div
  bind:this={ref}
  class={cn(cls('root'), className)}
  data-motion={motionLevel()}
  data-responsive={responsiveMode}
  data-sticky-header={stickyHeader ? '' : undefined}
  data-striped={striped ? '' : undefined}
  data-compact={compact ? '' : undefined}
  data-bordered={bordered ? '' : undefined}
  data-filter-open={openFilterCol ? '' : undefined}
  use:cssProps={styles}
  {...rest}
>
  {#if showSuggestions && aiInsights.length > 0}<DataTableSuggestions insights={aiInsights} />{/if}

  <div class="ui-data-table__toolbar" role="toolbar" aria-label="Table controls">
    {#if searchable}
      <div class="ui-data-table__search-wrapper">
        <!-- svelte-ignore a11y_no_redundant_roles (as React: explicit grid roles) -->
        <input type="search" role="searchbox" class="ui-data-table__search" placeholder="Search..." value={searchQuery} oninput={handleSearchInput} aria-label="Search table" />
        {#if searchQuery}<button type="button" class="ui-data-table__search-clear" onclick={clearSearch} aria-label="Clear search">&#x2715;</button>{/if}
      </div>
    {/if}
    {#if searchable && debouncedSearch}
      <span class="ui-data-table__result-count" aria-live="polite">{filteredData.length} result{filteredData.length !== 1 ? 's' : ''}</span>
    {/if}
    <Content value={toolbar} />
    <span use:cssProps={{ flex: '1 1 0' }}></span>
    <div class="ui-data-table__col-toggle" bind:this={colDropdownEl}>
      <button type="button" class="ui-data-table__toolbar-btn" onclick={() => { showColDropdown = !showColDropdown }} aria-label="Toggle columns" aria-expanded={showColDropdown} aria-haspopup="true"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.2" /><rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.2" /><rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.2" /><rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.2" /></svg>Columns</button>
      {#if showColDropdown}
        <div class="ui-data-table__col-dropdown" role="menu">
          <div class="ui-data-table__col-dropdown-actions">
            <button type="button" onclick={() => { hiddenColumns = new Set() }}>Show all</button>
            <button type="button" onclick={() => { hiddenColumns = new Set(columns.map(c => c.id)) }}>Hide all</button>
          </div>
          {#each columns as col}
            <label class="ui-data-table__col-item"><input type="checkbox" class="ui-data-table__col-checkbox" checked={!hiddenColumns.has(col.id)} onchange={() => toggleColumn(col.id)} />{getHeaderText(col.header, col.id)}</label>
          {/each}
        </div>
      {/if}
    </div>
    {#if exportable}
      <div class="ui-data-table__export-wrapper" bind:this={exportDropdownEl}>
        <button type="button" class="ui-data-table__toolbar-btn" onclick={() => { showExportDropdown = !showExportDropdown }} aria-label="Export" aria-expanded={showExportDropdown} aria-haspopup="true"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M7 1v8M3.5 5.5L7 9l3.5-3.5M2 11h10" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" /></svg>Export</button>
        {#if showExportDropdown}
          <div class="ui-data-table__export-dropdown" role="menu">
            <button type="button" class="ui-data-table__export-item" role="menuitem" onclick={() => handleExport('csv')}>Export CSV</button>
            <button type="button" class="ui-data-table__export-item" role="menuitem" onclick={() => handleExport('json')}>Export JSON</button>
          </div>
        {/if}
      </div>
    {/if}
  </div>

  {#if error}
    <div class="ui-data-table__error" role="alert">
      <span><Content value={error} /></span>
      {#if onRetry}<button type="button" class="ui-data-table__retry-btn" onclick={onRetry}>Retry</button>{/if}
    </div>
  {:else if virtualOn}
    <div bind:this={virtualEl} class="ui-data-table__virtual-scroll" use:cssProps={{ 'max-block-size': '600px' }} data-testid="virtual-scroll-container">
      <div class="ui-data-table__virtual-spacer" use:cssProps={{ height: `${virtual.totalHeight}px` }}>
        <div use:cssProps={{ transform: `translateY(${virtual.offsetY}px)` }}>{@render tableContent()}</div>
      </div>
    </div>
  {:else}
    <div class="ui-data-table__scroll">{@render tableContent()}</div>
  {/if}

  {#if paginated && !error && !loading}
    <nav class="ui-data-table__pagination" aria-label="Table pagination">
      <span class="ui-data-table__page-info">{pageInfoText}</span>
      <div class="ui-data-table__page-controls">
        <button type="button" class="ui-data-table__page-btn" disabled={page === 0} onclick={() => handlePageChange(page - 1)} aria-label="Previous page">&#x276E;</button>
        {#each paginationRange as p, i (p === 'ellipsis' ? `e${i}` : p)}
          {#if p === 'ellipsis'}
            <span use:cssProps={{ padding: '0 4px' }}>&hellip;</span>
          {:else}
            <button type="button" class="ui-data-table__page-btn" data-active={p === page ? '' : undefined} onclick={() => handlePageChange(p)} aria-label={`Page ${p + 1}`} aria-current={p === page ? 'page' : undefined}>{p + 1}</button>
          {/if}
        {/each}
        <button type="button" class="ui-data-table__page-btn" disabled={page >= totalPages - 1} onclick={() => handlePageChange(page + 1)} aria-label="Next page">&#x276F;</button>
        <select class="ui-data-table__page-size-select" value={showAllPages ? 'all' : pageSize} use:reactSelectFallback={[showAllPages, pageSize, pageSizes]} onchange={handlePageSizeChange} aria-label="Page size">
          {#each pageSizes as size}<option value={size}>{size} / page</option>{/each}
          <option value="all">All</option>
        </select>
      </div>
    </nav>
  {/if}
</div>
