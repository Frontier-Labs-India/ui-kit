<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import Content from '../lib/Content.svelte'
  import ErrorBoundary from '../lib/ErrorBoundary.svelte'
  import { formatBitRate } from '../lib/format-bitrate.js'
  import { sparklinePaths } from '../lib/sparkline.js'
  import { useEntrance } from '../runes/entrance.svelte.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  export interface TrafficData {
    inbound: number
    outbound: number
    timestamp?: number
  }

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    title: string | Snippet
    vendor?: string
    location?: string
    traffic: TrafficData
    trend?: number[]
    status?: 'ok' | 'warning' | 'critical' | 'unknown'
    compact?: boolean
    motion?: MotionLevel
    class?: string
  }

  let { title, vendor, location, traffic, trend, status, compact, motion, class: className, ref = $bindable(null), ...rest }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)
  const el = $derived(ref)
  useEntrance(() => el, () => (motionLevel() >= 2 ? 'fade-up' : 'none'), () => ({ duration: 280 }))
  const spark = $derived(sparklinePaths(trend))
</script>

{#snippet arrow(direction: 'inbound' | 'outbound', d: string)}
  <span class={`ui-network-traffic-card__arrow ui-network-traffic-card__arrow--${direction}`}>
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path {d} stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  </span>
{/snippet}

<ErrorBoundary>
  <div
    bind:this={ref}
    class={cn('ui-network-traffic-card', className)}
    data-motion={motionLevel()}
    data-status={status || undefined}
    data-compact={compact ? '' : undefined}
    role="group"
    aria-label={typeof title === 'string' ? title : undefined}
    {...rest}
  >
    <div class="ui-network-traffic-card__header">
      <h3 class="ui-network-traffic-card__title"><Content value={title} /></h3>
      {#if status}<span class="ui-network-traffic-card__status" role="status" aria-label={`Status: ${status}`}></span>{/if}
    </div>
    {#if vendor || location}
      <div class="ui-network-traffic-card__vendor">
        {#if vendor}<span>{vendor}</span>{/if}
        {#if vendor && location}<span class="ui-network-traffic-card__vendor-sep">/</span>{/if}
        {#if location}<span>{location}</span>{/if}
      </div>
    {/if}
    <div class="ui-network-traffic-card__traffic">
      <div class="ui-network-traffic-card__direction">
        <span class="ui-network-traffic-card__label">{@render arrow('inbound', 'M7 2v10M3 8l4 4 4-4')}Inbound</span>
        <span class="ui-network-traffic-card__rate">{formatBitRate(traffic.inbound)}</span>
      </div>
      <div class="ui-network-traffic-card__direction">
        <span class="ui-network-traffic-card__label">{@render arrow('outbound', 'M7 12V2M3 6l4-4 4 4')}Outbound</span>
        <span class="ui-network-traffic-card__rate">{formatBitRate(traffic.outbound)}</span>
      </div>
    </div>
    {#if spark}
      <div class="ui-network-traffic-card__sparkline">
        <svg viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="ntc-sparkline-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="oklch(65% 0.2 270)" stop-opacity="0.3" />
              <stop offset="100%" stop-color="oklch(65% 0.2 270)" stop-opacity="0" />
            </linearGradient>
          </defs>
          <path d={spark.area} fill="url(#ntc-sparkline-fill)" />
          <path d={spark.line} fill="none" stroke="oklch(65% 0.2 270)" stroke-width="1.5" />
        </svg>
      </div>
    {/if}
  </div>
</ErrorBoundary>
