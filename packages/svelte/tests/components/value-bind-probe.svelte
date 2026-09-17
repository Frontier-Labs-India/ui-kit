<script lang="ts">
  /* Binds `value` on any field component and mirrors it, for bind:value tests. */
  import type { Component } from 'svelte'
  let { field, initial, props = {} }: { field: Component<any>; initial: unknown; props?: Record<string, unknown> } = $props()
  // svelte-ignore state_referenced_locally
  let value = $state(initial)
</script>

{#each [field] as Field (Field)}<Field bind:value {...props} />{/each}
<output>{JSON.stringify(value)}</output>
