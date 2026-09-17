<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    children?: Snippet
    gap?: 'sm' | 'md' | 'lg'
    justify?: 'start' | 'end' | 'between' | 'center'
    wrap?: boolean
    sticky?: boolean
    class?: string
  }

  let { children, gap = 'md', justify = 'start', wrap = false, sticky = false, class: className, ref = $bindable(null), ...rest }: Props = $props()
  const cls = makeCls('toolbar')
</script>

<div
  role="toolbar"
  class={cn(cls('root'), className)}
  data-gap={gap}
  data-justify={justify}
  data-wrap={wrap || undefined}
  data-sticky={sticky || undefined}
  bind:this={ref}
  {...rest}
>
  {#if children}{@render children()}{/if}
</div>
