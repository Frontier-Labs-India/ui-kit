<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'

  interface Props extends HTMLAttributes<HTMLDivElement> {
    children?: Snippet
    class?: string
  }

  let { children, class: className, ...rest }: Props = $props()
</script>

<div class={cn('ui-sidebar__header', className)} {...rest}>{#if children}{@render children()}{/if}</div>
