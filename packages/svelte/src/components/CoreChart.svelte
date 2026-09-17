<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import ErrorBoundary from '../lib/ErrorBoundary.svelte'
  import { cssProps } from '../actions/css-props.js'
  import { reactStyle } from '../lib/react-style.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  export interface CoreChartCore {
    id: number
    usage: number
  }

  interface Props extends HTMLAttributes<HTMLDivElement> {
    cores: CoreChartCore[]
    columns?: number
    size?: 'sm' | 'md' | 'lg'
    showLabels?: boolean
    colorScale?: 'green-red' | 'blue-red' | 'brand'
    motion?: MotionLevel
    class?: string
  }

  function usageToColor(usage: number, scale: 'green-red' | 'blue-red' | 'brand'): string {
    const u = Math.max(0, Math.min(100, usage))
    if (scale === 'green-red') return `oklch(65% ${(0.15 + (u / 100) * 0.07).toFixed(3)} ${(155 - (u / 100) * 130).toFixed(0)})`
    if (scale === 'blue-red') return `oklch(60% ${(0.12 + (u / 100) * 0.1).toFixed(3)} ${(250 - (u / 100) * 225).toFixed(0)})`
    return `oklch(${(50 + (u / 100) * 20).toFixed(0)}% 0.2 270)`
  }

  let { cores, columns, size = 'md', showLabels = false, colorScale = 'green-red', motion, class: className, ...rest }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)
  let tooltip = $state<{ core: CoreChartCore; x: number; y: number } | null>(null)
  const cols = $derived(columns ?? Math.ceil(Math.sqrt(cores.length)))

  function enter(e: MouseEvent, core: CoreChartCore) {
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    tooltip = { core, x: rect.left + rect.width / 2, y: rect.top }
  }
</script>

<ErrorBoundary>
  <div class={cn('ui-core-chart', className)} data-size={size} data-motion={motionLevel()} role="img" aria-label={`CPU core utilization: ${cores.length} cores`} {...rest}>
    <div class="ui-core-chart__grid" use:cssProps={reactStyle({ gridTemplateColumns: `repeat(${cols}, var(--cell-size, 24px))` })}>
      {#each cores as core (core.id)}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="ui-core-chart__cell"
          use:cssProps={reactStyle({ backgroundColor: usageToColor(core.usage, colorScale) })}
          onmouseenter={e => enter(e, core)}
          onmouseleave={() => (tooltip = null)}
        >{#if showLabels}<span class="ui-core-chart__cell-label">{core.id}</span>{/if}</div>
      {/each}
    </div>
    {#if tooltip}
      <div class="ui-core-chart__tooltip" use:cssProps={reactStyle({ left: tooltip.x, top: tooltip.y })}>Core {tooltip.core.id}: {tooltip.core.usage}%</div>
    {/if}
  </div>
</ErrorBoundary>
