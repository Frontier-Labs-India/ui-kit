<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import ErrorBoundary from '../lib/ErrorBoundary.svelte'
  import { cssProps } from '../actions/css-props.js'
  import { reactStyle } from '../lib/react-style.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  export interface StorageBarSegment {
    label: string
    value: number
    color?: string
  }

  interface Props extends HTMLAttributes<HTMLDivElement> {
    segments: StorageBarSegment[]
    total: number
    showLabels?: boolean
    showLegend?: boolean
    size?: 'sm' | 'md' | 'lg'
    motion?: MotionLevel
    class?: string
  }

  const COLORS = ['oklch(65% 0.2 270)', 'oklch(72% 0.19 155)', 'oklch(78% 0.17 85)', 'oklch(62% 0.22 25)', 'oklch(70% 0.16 200)', 'oklch(68% 0.18 320)']
  // Values are in GB; 1024 and above reads as TB.
  const fmt = (gb: number) => (gb >= 1024 ? `${(gb / 1024).toFixed(1)} TB` : `${gb.toFixed(1)} GB`)

  let { segments, total, showLabels = false, showLegend = false, size = 'md', motion, class: className, ...rest }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)
  let tooltip = $state<{ seg: StorageBarSegment; pct: number; x: number; y: number } | null>(null)
  const used = $derived(segments.reduce((sum, s) => sum + s.value, 0))
  const colorOf = (s: StorageBarSegment, i: number) => s.color ?? COLORS[i % COLORS.length]

  function enter(e: MouseEvent, seg: StorageBarSegment, pct: number) {
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    tooltip = { seg, pct, x: rect.left + rect.width / 2, y: rect.top }
  }
</script>

<ErrorBoundary>
  <div class={cn('ui-storage-bar', className)} data-size={size} data-motion={motionLevel()} role="img" aria-label={`Storage: ${fmt(used)} of ${fmt(total)} used`} {...rest}>
    <div class="ui-storage-bar__track">
      {#each segments as seg, i (seg.label)}
        {@const pct = (seg.value / total) * 100}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="ui-storage-bar__segment"
          use:cssProps={reactStyle({ inlineSize: `${pct}%`, backgroundColor: colorOf(seg, i) })}
          onmouseenter={e => enter(e, seg, pct)}
          onmouseleave={() => (tooltip = null)}
        >{#if showLabels}<span class="ui-storage-bar__segment-label">{seg.label}</span>{/if}</div>
      {/each}
    </div>
    {#if tooltip}
      <div class="ui-storage-bar__tooltip" use:cssProps={reactStyle({ left: tooltip.x, top: tooltip.y })}>{tooltip.seg.label}: {fmt(tooltip.seg.value)} ({tooltip.pct.toFixed(1)}%)</div>
    {/if}
    {#if showLegend}
      <div class="ui-storage-bar__legend">
        {#each segments as seg, i (seg.label)}
          <span class="ui-storage-bar__legend-item"><span class="ui-storage-bar__legend-swatch" use:cssProps={reactStyle({ backgroundColor: colorOf(seg, i) })}></span>{seg.label}: {fmt(seg.value)}</span>
        {/each}
        <span class="ui-storage-bar__legend-item">Free: {fmt(total - used)}</span>
      </div>
    {/if}
  </div>
</ErrorBoundary>
