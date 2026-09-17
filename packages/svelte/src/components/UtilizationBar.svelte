<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import ErrorBoundary from '../lib/ErrorBoundary.svelte'
  import { cssProps } from '../actions/css-props.js'
  import { reactStyle } from '../lib/react-style.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  export interface UtilizationSegment {
    value: number
    color?: string
    label?: string
  }

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    segments: UtilizationSegment[]
    max?: number
    thresholds?: { warning: number; critical: number }
    showLabels?: boolean
    size?: 'sm' | 'md' | 'lg'
    motion?: MotionLevel
    class?: string
  }

  const COLORS = ['oklch(65% 0.2 270)', 'oklch(72% 0.19 155)', 'oklch(80% 0.18 85)', 'oklch(70% 0.15 330)', 'oklch(60% 0.2 30)']

  let { segments, max = 100, thresholds, showLabels = false, size = 'md', motion, class: className, ref = $bindable(null), ...rest }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)
  let hovered = $state<number | null>(null)
  // `||`, as React: an empty-string colour falls back too.
  const colorOf = (s: UtilizationSegment, i: number) => s.color || COLORS[i % COLORS.length]
</script>

<ErrorBoundary>
  <div class={cn('ui-utilization-bar', className)} data-motion={motionLevel()} data-size={size} role="group" aria-label="Utilization" bind:this={ref} {...rest}>
    <div class="ui-utilization-bar__track">
      {#each segments as seg, i (i)}
        <div
          class="ui-utilization-bar__segment"
          use:cssProps={reactStyle({ width: `${(seg.value / max) * 100}%`, background: colorOf(seg, i) })}
          onmouseenter={() => (hovered = i)}
          onmouseleave={() => (hovered = null)}
          role="presentation"
        >{#if hovered === i}<div class="ui-utilization-bar__tooltip">{seg.label ? `${seg.label}: ` : ''}{seg.value} / {max}</div>{/if}</div>
      {/each}
      {#if thresholds}
        <div class="ui-utilization-bar__threshold" data-level="warning" use:cssProps={reactStyle({ insetInlineStart: `${thresholds.warning}%` })}></div>
        <div class="ui-utilization-bar__threshold" data-level="critical" use:cssProps={reactStyle({ insetInlineStart: `${thresholds.critical}%` })}></div>
      {/if}
    </div>
    {#if showLabels && segments.some(s => s.label)}
      <div class="ui-utilization-bar__labels">
        {#each segments as seg, i (i)}
          {#if seg.label}<span class="ui-utilization-bar__label-item"><span class="ui-utilization-bar__label-dot" use:cssProps={reactStyle({ background: colorOf(seg, i) })}></span>{seg.label}</span>{/if}
        {/each}
      </div>
    {/if}
  </div>
</ErrorBoundary>
