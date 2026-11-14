<script lang="ts">
  import DataTable from '../../src/components/DataTable.svelte'

  /* Binds every value DataTable makes bindable, so a test can read what the
   * table wrote back. Remaining props pass straight through. */
  let { initialSort = [], initialSelected = [], initialFilters = {}, initialExpanded = [], ...props }: Record<string, any> = $props()
  // svelte-ignore state_referenced_locally
  let sortBy = $state(initialSort)
  // svelte-ignore state_referenced_locally
  let selectedRows = $state(new Set<number>(initialSelected))
  // svelte-ignore state_referenced_locally
  let filters = $state(initialFilters)
  // svelte-ignore state_referenced_locally
  let expandedGroups = $state(new Set<string>(initialExpanded))
  export const get = () => ({ sortBy, selectedRows: [...selectedRows].sort((a, b) => a - b), filters, expandedGroups: [...expandedGroups].sort() })
</script>

<DataTable {...props as any} bind:sortBy bind:selectedRows bind:filters bind:expandedGroups />
