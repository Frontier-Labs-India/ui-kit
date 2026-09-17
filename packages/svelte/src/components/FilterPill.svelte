<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLButtonAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'
  import Content from '../lib/Content.svelte'
  import Icon from '../lib/Icon.svelte'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends HTMLButtonAttributes {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLButtonElement | null
    label: string
    active?: boolean
    onRemove?: () => void
    count?: number
    icon?: string | Snippet
    size?: 'sm' | 'md'
    motion?: MotionLevel
    class?: string
  }

  let { label, active = false, onRemove, count, icon, size = 'md', motion, class: className, onclick, ref = $bindable(null), ...rest }: Props = $props()

  const cls = makeCls('filter-pill')
  const motionLevel = getMotionLevel(() => motion)

  function remove(e: MouseEvent) {
    e.stopPropagation()
    onRemove?.()
  }
</script>

{#snippet body()}
  {#if icon}<span class="ui-filter-pill__icon" aria-hidden="true"><Content value={icon} /></span>{/if}
  <span class="ui-filter-pill__label">{label}</span>
  {#if count !== undefined}<span class="ui-filter-pill__count">{count}</span>{/if}
{/snippet}

{#if onRemove}
  <!-- With a remove button the pill is a group of two buttons, never one button
       nested in another. -->
  <span
    class={cn(cls('root'), className)}
    data-size={size}
    data-motion={motionLevel()}
    data-active={active ? '' : undefined}
    role="group"
    aria-label={`${label} filter`}
  >
    <button type="button" class="ui-filter-pill__main" aria-pressed={active} {onclick} bind:this={ref} {...rest}>{@render body()}</button>
    <button type="button" class="ui-filter-pill__remove" onclick={remove} aria-label={`Remove ${label}`}><Icon name="x" size="sm" /></button>
  </span>
{:else}
  <button
    type="button"
    class={cn(cls('root'), className)}
    data-size={size}
    data-motion={motionLevel()}
    data-active={active ? '' : undefined}
    aria-pressed={active}
    {onclick}
    bind:this={ref}
    {...rest}
  >{@render body()}</button>
{/if}
