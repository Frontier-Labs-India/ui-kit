<script lang="ts">
  import type { Snippet } from 'svelte'

  /* Renders a ReactNode-shaped prop: a snippet, or a primitive rendered the way
   * React renders it — strings and numbers (0 included) appear; null,
   * undefined, true and false render nothing. Adds no DOM of its own. */
  let { value }: { value: Snippet | string | number | boolean | null | undefined } = $props()
</script>

{#if typeof value === 'function'}{@render value()}{:else if typeof value === 'string' || typeof value === 'number'}{value}{/if}
