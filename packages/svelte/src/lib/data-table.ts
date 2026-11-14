/* DataTable's pure helpers, copied from src/domain/data-table.tsx and
 * drift-tested (tests/components/data-table.test.ts): each function must stay
 * token-for-token identical to React's, `export` and whitespace aside. */
import type { Snippet } from 'svelte'

/* React's ReactNode, as this package reads a ReactNode prop: a string or a
 * snippet. Named so the copied signatures read exactly as React's do. */
type ReactNode = string | Snippet

export interface ColumnDef<T> {
  id: string
  /** A string, or a snippet (React's element and function headers alike). */
  header: ReactNode
  accessor: keyof T | ((row: T) => unknown)
  /** Renders the cell; receives React's `cell(value, row, rowIndex)` arguments. */
  cell?: Snippet<[unknown, T, number]>
  sortable?: boolean
  resizable?: boolean
  width?: number | string
  minWidth?: number
  pinned?: 'left' | 'right'
  align?: 'left' | 'center' | 'right'
  hidden?: boolean
  searchable?: boolean
  // Per-column filter
  filterable?: boolean
  filterType?: 'text' | 'number' | 'select' | 'date'
  filterOptions?: string[]
  // Cell editing
  editable?: boolean
  onCellEdit?: (rowIndex: number, value: unknown) => void
  // Auto-size
  autoSize?: boolean
}

export type SortEntry = { column: string; direction: 'asc' | 'desc' }
export type ColumnFilter = { value: string; operator: string }

export function getCellValue<T>(row: T, accessor: keyof T | ((row: T) => unknown)): unknown {
  return typeof accessor === 'function' ? accessor(row) : row[accessor]
}

export function getHeaderText(header: ReactNode | (() => ReactNode), id: string): string {
  if (typeof header === 'string') return header
  if (typeof header === 'function') return id
  return id
}

export function toCSV<T extends object>(
  data: T[],
  columns: ColumnDef<T>[]
): string {
  const headers = columns.map(col => getHeaderText(col.header, col.id))
  const escape = (v: string) => {
    if (v.includes(',') || v.includes('"') || v.includes('\n')) {
      return `"${v.replace(/"/g, '""')}"`
    }
    return v
  }
  const rows = data.map(row =>
    columns.map(col => escape(String(getCellValue(row, col.accessor) ?? ''))).join(',')
  )
  return [headers.map(escape).join(','), ...rows].join('\n')
}

export function toJSON<T extends object>(
  data: T[],
  columns: ColumnDef<T>[]
): string {
  const mapped = data.map(row => {
    const obj: Record<string, unknown> = {}
    for (const col of columns) {
      obj[col.id] = getCellValue(row, col.accessor)
    }
    return obj
  })
  return JSON.stringify(mapped, null, 2)
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function compareValues(a: unknown, b: unknown, direction: 'asc' | 'desc'): number {
  if (a == null && b == null) return 0
  if (a == null) return direction === 'asc' ? -1 : 1
  if (b == null) return direction === 'asc' ? 1 : -1
  if (typeof a === 'number' && typeof b === 'number') {
    return direction === 'asc' ? a - b : b - a
  }
  const aStr = String(a)
  const bStr = String(b)
  const cmp = aStr.localeCompare(bStr)
  return direction === 'asc' ? cmp : -cmp
}

export const DEFAULT_ROW_HEIGHT = 40
export const BUFFER_ROWS = 10

type FilterOperator = 'contains' | 'equals' | 'gt' | 'lt' | 'startsWith' | 'endsWith' | 'notContains' | 'isEmpty' | 'isNotEmpty' | 'gte' | 'lte' | 'between' | 'before' | 'after' | 'isOneOf' | 'isNotOneOf'

export function applyFilter(value: unknown, filter: { value: string; operator: string }): boolean {
  const strVal = String(value ?? '').toLowerCase()
  const filterVal = filter.value.toLowerCase()
  const op = filter.operator as FilterOperator

  switch (op) {
    case 'contains': return strVal.includes(filterVal)
    case 'equals': return strVal === filterVal
    case 'startsWith': return strVal.startsWith(filterVal)
    case 'endsWith': return strVal.endsWith(filterVal)
    case 'notContains': return !strVal.includes(filterVal)
    case 'isEmpty': return strVal === ''
    case 'isNotEmpty': return strVal !== ''
    case 'gt': {
      const n = Number(value); const f = Number(filter.value)
      return !isNaN(n) && !isNaN(f) && n > f
    }
    case 'lt': {
      const n = Number(value); const f = Number(filter.value)
      return !isNaN(n) && !isNaN(f) && n < f
    }
    case 'gte': {
      const n = Number(value); const f = Number(filter.value)
      return !isNaN(n) && !isNaN(f) && n >= f
    }
    case 'lte': {
      const n = Number(value); const f = Number(filter.value)
      return !isNaN(n) && !isNaN(f) && n <= f
    }
    case 'between': {
      const [lo, hi] = filter.value.split(',').map(Number)
      const n = Number(value)
      return !isNaN(n) && !isNaN(lo) && !isNaN(hi) && n >= lo && n <= hi
    }
    case 'before': {
      const d = new Date(String(value)); const f = new Date(filter.value)
      return !isNaN(d.getTime()) && !isNaN(f.getTime()) && d < f
    }
    case 'after': {
      const d = new Date(String(value)); const f = new Date(filter.value)
      return !isNaN(d.getTime()) && !isNaN(f.getTime()) && d > f
    }
    case 'isOneOf': {
      const vals = filter.value.split(',').map(v => v.trim().toLowerCase())
      return vals.includes(strVal)
    }
    case 'isNotOneOf': {
      const vals = filter.value.split(',').map(v => v.trim().toLowerCase())
      return !vals.includes(strVal)
    }
    default: return strVal.includes(filterVal)
  }
}

export function getOperatorsForType(type?: 'text' | 'number' | 'select' | 'date'): { value: string; label: string }[] {
  switch (type) {
    case 'number':
      return [
        { value: 'equals', label: 'Equals' },
        { value: 'gt', label: 'Greater than' },
        { value: 'lt', label: 'Less than' },
        { value: 'gte', label: 'Greater or equal' },
        { value: 'lte', label: 'Less or equal' },
        { value: 'between', label: 'Between' },
      ]
    case 'date':
      return [
        { value: 'equals', label: 'Equals' },
        { value: 'before', label: 'Before' },
        { value: 'after', label: 'After' },
        { value: 'between', label: 'Between' },
      ]
    case 'select':
      return [
        { value: 'isOneOf', label: 'Is one of' },
        { value: 'isNotOneOf', label: 'Is not one of' },
      ]
    default: // text
      return [
        { value: 'contains', label: 'Contains' },
        { value: 'equals', label: 'Equals' },
        { value: 'startsWith', label: 'Starts with' },
        { value: 'endsWith', label: 'Ends with' },
        { value: 'notContains', label: 'Not contains' },
        { value: 'isEmpty', label: 'Is empty' },
        { value: 'isNotEmpty', label: 'Is not empty' },
      ]
  }
}

export function computeAggregation(values: unknown[], aggType: 'sum' | 'avg' | 'count' | 'min' | 'max'): string {
  const nums = values.map(Number).filter(n => !isNaN(n))
  switch (aggType) {
    case 'count': return String(values.length)
    case 'sum': return String(nums.reduce((a, b) => a + b, 0))
    case 'avg': return nums.length ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1) : '0'
    case 'min': return nums.length ? String(Math.min(...nums)) : ''
    case 'max': return nums.length ? String(Math.max(...nums)) : ''
  }
}

