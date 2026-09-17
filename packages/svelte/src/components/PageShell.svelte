<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'

  interface Props extends HTMLAttributes<HTMLDivElement> {
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
    padding?: 'none' | 'sm' | 'md' | 'lg'
    children?: Snippet
    class?: string
  }

  let { maxWidth = 'lg', padding = 'md', children, class: className, ...rest }: Props = $props()
  const cls = makeCls('page-shell')
</script>

<div class={cn(cls('root'), className)} data-max-width={maxWidth} data-padding={padding} {...rest}>
  {#if children}{@render children()}{/if}
</div>
