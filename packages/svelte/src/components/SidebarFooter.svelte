<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    children?: Snippet
    class?: string
  }

  let { children, class: className, ref = $bindable(null), ...rest }: Props = $props()
</script>

<div class={cn('ui-sidebar__footer', className)} bind:this={ref} {...rest}>{#if children}{@render children()}{/if}</div>
