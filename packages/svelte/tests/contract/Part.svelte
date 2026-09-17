<script lang="ts">
  import type { Component } from 'svelte'
  import * as pkg from '../../src/index.js'
  import Part from './Part.svelte'
  import { hydrate, renamed, isPartList, type PartNode } from './hydrate.svelte.js'

  // One `{ $part }` node of a case, rendered as a caller would write it.
  let { node }: { node: PartNode } = $props()
  const C = $derived((pkg as Record<string, unknown>)[node.$part] as Component<any>)
  const split = $derived(renamed(node.$part, node.props ?? {}))
  const children = $derived(split.children)
  const partProps = $derived(hydrate(Object.fromEntries(Object.entries(split).filter(([k]) => k !== 'children'))) as Record<string, unknown>)
</script>

{#if isPartList(children)}<C {...partProps}>{#each children as child}<Part node={child} />{/each}</C>{:else}<C {...partProps} children={hydrate(children)} />{/if}
