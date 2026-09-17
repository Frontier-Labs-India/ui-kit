<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import ErrorBoundary from '../lib/ErrorBoundary.svelte'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  export interface UptimeDay {
    date: string
    status: 'up' | 'degraded' | 'down' | 'unknown'
    uptime?: number
  }

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    days: UptimeDay[]
    slaTarget?: number
    showSla?: boolean
    motion?: MotionLevel
    class?: string
  }

  let { days, slaTarget, showSla = false, motion, class: className, ref = $bindable(null), ...rest }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)
  let hovered = $state<number | null>(null)
  // Mean over the days that report uptime; null when none do.
  const current = $derived.by(() => {
    const withUptime = days.filter(d => d.uptime !== undefined)
    return withUptime.length === 0 ? null : withUptime.reduce((a, d) => a + (d.uptime ?? 0), 0) / withUptime.length
  })
  const pct = (u: number) => ` (${(u * 100).toFixed(1)}%)`
</script>

<ErrorBoundary>
  <div class={cn('ui-uptime-tracker', className)} data-motion={motionLevel()} role="group" aria-label="Uptime history" bind:this={ref} {...rest}>
    <div class="ui-uptime-tracker__bar">
      {#each days as day, i (day.date)}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="ui-uptime-tracker__day"
          data-day-status={day.status}
          onmouseenter={() => (hovered = i)}
          onmouseleave={() => (hovered = null)}
          role="img"
          aria-label={`${day.date}: ${day.status}${day.uptime !== undefined ? pct(day.uptime) : ''}`}
        >{#if hovered === i}<div class="ui-uptime-tracker__tooltip">{day.date} — {day.status}{#if day.uptime !== undefined}{pct(day.uptime)}{/if}</div>{/if}</div>
      {/each}
    </div>
    {#if showSla}
      <div class="ui-uptime-tracker__sla">
        <span><span class="ui-uptime-tracker__sla-value">{current !== null ? `${(current * 100).toFixed(current === 1 ? 0 : 2)}%` : 'N/A'}</span> uptime</span>
        {#if slaTarget !== undefined}<span class="ui-uptime-tracker__sla-target">Target: {(slaTarget * 100).toFixed(1)}%</span>{/if}
      </div>
    {/if}
  </div>
</ErrorBoundary>
