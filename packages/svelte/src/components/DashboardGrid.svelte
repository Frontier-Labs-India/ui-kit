<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import ErrorBoundary from '../lib/ErrorBoundary.svelte'
  import DashboardGridGroup from '../lib/DashboardGridGroup.svelte'
  import type { DashboardGroup } from '../lib/dashboard-grid.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends HTMLAttributes<HTMLDivElement> {
    groups?: DashboardGroup[]
    columns?: number | 'auto'
    gap?: 'sm' | 'md' | 'lg'
    children?: Snippet
    motion?: MotionLevel
    class?: string
  }

  let { groups, columns = 'auto', gap = 'md', children, motion, class: className, ...rest }: Props = $props()
  const motionLevel = getMotionLevel(() => motion)
</script>

<ErrorBoundary>
  <div class={cn('ui-dashboard-grid', className)} data-motion={motionLevel()} data-columns={columns} data-gap={gap} {...rest}>
    {#if groups}
      {#each groups as group (group.id)}<DashboardGridGroup {group} />{/each}
    {:else}
      <div class="ui-dashboard-grid__grid">{#if children}{@render children()}{/if}</div>
    {/if}
  </div>
</ErrorBoundary>
