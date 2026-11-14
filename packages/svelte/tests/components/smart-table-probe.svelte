<script lang="ts">
  import SmartTable from '../../src/components/SmartTable.svelte'
  let props: Record<string, any> = $props()
  let sortBy = $state<{ column: string; direction: 'asc' | 'desc' }[]>([])
  export const get = () => sortBy
</script>

<SmartTable {...props as any} bind:sortBy />
