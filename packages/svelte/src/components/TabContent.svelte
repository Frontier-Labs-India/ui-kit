<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import Content from '../lib/Content.svelte'
  import { getTabsContext } from '../lib/tabs-context.js'

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    value: string
    children?: string | Snippet
    class?: string
  }

  let { value, children, class: className, ref = $bindable(null), ...rest }: Props = $props()
  const ctx = getTabsContext()
  const isActive = $derived(ctx?.activeId === value)
</script>

<div
  bind:this={ref}
  id={ctx ? `${ctx.baseId}-panel-${value}` : undefined}
  role="tabpanel"
  aria-labelledby={ctx ? `${ctx.baseId}-tab-${value}` : undefined}
  class={cn('ui-tabs__panel', className)}
  hidden={!isActive}
  tabindex={isActive ? 0 : -1}
  {...rest}
><Content value={children} /></div>
