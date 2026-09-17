<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    children?: Snippet
    columns?: 2 | 3 | 4 | 5 | 6
    gap?: 'sm' | 'md' | 'lg'
    class?: string
  }

  let { columns = 4, gap = 'md', children, class: className, ref = $bindable(null), ...rest }: Props = $props()
  const cls = makeCls('stats-grid')
</script>

<div class={cn(cls('root'), className)} data-columns={columns} data-gap={gap} role="region" bind:this={ref} {...rest}>
  {#if children}{@render children()}{/if}
</div>
