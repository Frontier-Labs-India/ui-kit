<script module lang="ts">
  import type { Snippet } from 'svelte'

  export interface TimelineItem {
    id: string
    title: string | Snippet
    description?: string | Snippet
    icon?: string | Snippet
    timestamp?: string
    status?: 'completed' | 'active' | 'pending' | 'error'
  }
</script>

<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import Content from '../lib/Content.svelte'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    items: TimelineItem[]
    variant?: 'default' | 'alternate' | 'compact'
    size?: 'sm' | 'md' | 'lg'
    connectorStyle?: 'solid' | 'dashed' | 'dotted'
    motion?: MotionLevel
    class?: string
  }

  let { items, variant = 'default', size = 'md', connectorStyle = 'solid', motion, class: className, ref = $bindable(null), ...rest }: Props = $props()
  const motionLevel = getMotionLevel(() => motion)
</script>

<div class={cn('ui-timeline', className)} data-variant={variant} data-size={size} data-connector={connectorStyle} data-motion={motionLevel()} role="list" bind:this={ref} {...rest}>
  {#each items as item (item.id)}
    <div class="ui-timeline__item" role="listitem">
      <span class="ui-timeline__dot" data-status={item.status ?? 'pending'} aria-hidden="true"><Content value={item.icon} /></span>
      <div class="ui-timeline__content">
        <span class="ui-timeline__title"><Content value={item.title} /></span>
        {#if item.description}<span class="ui-timeline__description"><Content value={item.description} /></span>{/if}
        {#if item.timestamp}<time class="ui-timeline__timestamp">{item.timestamp}</time>{/if}
      </div>
    </div>
  {/each}
</div>
