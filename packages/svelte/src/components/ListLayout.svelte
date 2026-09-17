<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'

  interface Props extends HTMLAttributes<HTMLDivElement> {
    children?: Snippet
    gap?: 'sm' | 'md' | 'lg'
    dividers?: boolean
    padding?: 'none' | 'sm' | 'md'
    class?: string
  }

  let { gap = 'md', dividers = false, padding = 'none', children, class: className, ...rest }: Props = $props()
  const cls = makeCls('list-layout')
</script>

<div class={cn(cls('root'), className)} data-gap={gap} data-dividers={dividers || undefined} data-padding={padding} {...rest}>
  {#if children}{@render children()}{/if}
</div>
