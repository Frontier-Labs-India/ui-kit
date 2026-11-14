<script lang="ts" generics="T extends object">
  import type { ComponentProps } from 'svelte'
  import DataTable from './DataTable.svelte'
  import { makeCls, cn } from '../lib/cls.js'

  /* React's SmartTable: a thin wrapper that maps its legacy props onto
   * DataTable. `filterable` is an alias for search (it does NOT turn on
   * DataTable's column filters), `searchPlaceholder` and `columnToggle` are
   * accepted and ignored, as in React. The wrapper takes `class`; `ref` and
   * every other prop go to DataTable, whose bindable values are forwarded. */
  type Props = Omit<ComponentProps<typeof DataTable<T>>, 'filterable'> & {
    /** Enable the search bar. */
    searchable?: boolean
    /** Accepted for React parity; DataTable has no placeholder prop, so it is unused. */
    searchPlaceholder?: string
    /** An alias for `searchable`. */
    filterable?: boolean
    paginated?: boolean
    /** Accepted for React parity; the column toggle is always shown. */
    columnToggle?: boolean
    class?: string
  }

  let {
    searchable = false, searchPlaceholder: _searchPlaceholder, filterable = false, paginated = false,
    columnToggle: _columnToggle = false, sortable = true, class: className, ref = $bindable(null),
    // DataTable's own fallbacks: Svelte refuses to bind `undefined` into a prop that has one.
    sortBy = $bindable([]), selectedRows = $bindable(new Set()), filters = $bindable({}), expandedGroups = $bindable(new Set()), ...rest
  }: Props = $props()

  const cls = makeCls('smart-table')
</script>

<div class={cn(cls('root'), className)}>
  <DataTable
    bind:ref
    bind:sortBy
    bind:selectedRows
    bind:filters
    bind:expandedGroups
    searchable={searchable || filterable}
    {paginated}
    {sortable}
    {...rest}
  />
</div>
