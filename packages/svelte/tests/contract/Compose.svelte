<script lang="ts">
  import type { Component } from 'svelte'
  import Part from './Part.svelte'
  import type { PartNode } from './hydrate.svelte.js'

  // A case whose `children` is a list of parts: the root with those parts inside.
  // `target.ref` is bound so the ref suite can read the root's ref.
  let { component: C, rootProps, parts, target }: {
    component: Component<any>; rootProps: Record<string, unknown>; parts: PartNode[]; target: { ref: unknown }
  } = $props()
</script>

<C {...rootProps} bind:ref={target.ref}>{#each parts as part}<Part node={part} />{/each}</C>
