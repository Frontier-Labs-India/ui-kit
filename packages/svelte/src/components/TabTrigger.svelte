<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLButtonAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import Content from '../lib/Content.svelte'
  import { getTabsContext } from '../lib/tabs-context.js'

  interface Props extends Omit<HTMLButtonAttributes, 'children'> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLButtonElement | null
    value: string
    disabled?: boolean
    children?: string | Snippet
    class?: string
  }

  let { value, disabled, children, class: className, ref = $bindable(null), ...rest }: Props = $props()
  const ctx = getTabsContext()
  const isActive = $derived(ctx?.activeId === value)
</script>

<button
  bind:this={ref}
  id={ctx ? `${ctx.baseId}-tab-${value}` : undefined}
  role="tab"
  type="button"
  aria-selected={isActive}
  aria-controls={ctx ? `${ctx.baseId}-panel-${value}` : undefined}
  aria-disabled={disabled || undefined}
  tabindex={disabled ? -1 : isActive ? 0 : -1}
  class={cn('ui-tabs__tab', className)}
  onclick={() => { if (!disabled) ctx?.onSelect(value) }}
  {...rest}
><Content value={children} /></button>
