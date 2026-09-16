<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'

  interface Props extends HTMLAttributes<HTMLDivElement> {
    onClearAll?: () => void
    clearLabel?: string
    children?: Snippet
    class?: string
  }

  let { onClearAll, clearLabel = 'Clear all', children, class: className, ...rest }: Props = $props()
  const cls = makeCls('filter-pill-group')
</script>

<div class={cn(cls('root'), className)} role="group" aria-label="Active filters" {...rest}>
  {#if children}{@render children()}{/if}
  {#if onClearAll}<button type="button" class="ui-filter-pill-group__clear" onclick={onClearAll}>{clearLabel}</button>{/if}
</div>
