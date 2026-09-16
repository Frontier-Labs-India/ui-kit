<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'

  interface Props extends HTMLAttributes<HTMLDivElement> {
    children?: Snippet
    gap?: 'sm' | 'md' | 'lg'
    justify?: 'start' | 'end' | 'between' | 'center'
    wrap?: boolean
    sticky?: boolean
    class?: string
  }

  let { children, gap = 'md', justify = 'start', wrap = false, sticky = false, class: className, ...rest }: Props = $props()
  const cls = makeCls('toolbar')
</script>

<div
  role="toolbar"
  class={cn(cls('root'), className)}
  data-gap={gap}
  data-justify={justify}
  data-wrap={wrap || undefined}
  data-sticky={sticky || undefined}
  {...rest}
>
  {#if children}{@render children()}{/if}
</div>
