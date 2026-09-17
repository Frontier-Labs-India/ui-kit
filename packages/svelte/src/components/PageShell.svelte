<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
    padding?: 'none' | 'sm' | 'md' | 'lg'
    children?: Snippet
    class?: string
  }

  let { maxWidth = 'lg', padding = 'md', children, class: className, ref = $bindable(null), ...rest }: Props = $props()
  const cls = makeCls('page-shell')
</script>

<div class={cn(cls('root'), className)} data-max-width={maxWidth} data-padding={padding} bind:this={ref} {...rest}>
  {#if children}{@render children()}{/if}
</div>
