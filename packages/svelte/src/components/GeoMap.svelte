<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import ErrorBoundary from '../lib/ErrorBoundary.svelte'
  import { cssProps } from '../actions/css-props.js'
  import { geoToSvg } from '../lib/geo.js'
  import { mergeStyles, type StyleInput } from '../lib/react-style.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  export interface GeoPoint {
    id: string
    lat: number
    lng: number
    label?: string
    value?: number
    status?: 'ok' | 'warning' | 'critical' | 'unknown'
    tooltip?: string | Snippet
  }
  export interface GeoConnection {
    from: string
    to: string
    value?: number
    status?: 'ok' | 'warning' | 'critical'
  }

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'style'> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    points: GeoPoint[]
    connections?: GeoConnection[]
    /** Accepted for API parity; React renders equirectangular for both values. */
    projection?: 'mercator' | 'equirectangular'
    showLabels?: boolean
    interactive?: boolean
    onPointClick?: (point: GeoPoint) => void
    onPointHover?: (point: GeoPoint | null) => void
    height?: number | string
    motion?: MotionLevel
    style?: StyleInput
    class?: string
  }

  // Rough continent outlines in equirectangular coordinates, identical to React's.
  const WORLD_PATHS = [
    'M 30 25 L 55 15 L 75 18 L 95 22 L 110 28 L 115 35 L 110 40 L 100 45 L 92 50 L 85 55 L 80 60 L 70 62 L 60 58 L 55 52 L 48 48 L 40 42 L 32 35 Z',
    'M 95 75 L 105 70 L 115 72 L 120 78 L 118 85 L 120 95 L 118 105 L 115 115 L 110 125 L 105 130 L 100 140 L 95 145 L 90 140 L 88 130 L 90 120 L 88 110 L 85 100 L 88 90 L 90 82 Z',
    'M 170 22 L 175 18 L 185 20 L 195 22 L 200 28 L 198 32 L 195 35 L 190 38 L 185 40 L 180 42 L 175 40 L 170 35 L 168 30 Z',
    'M 170 52 L 180 48 L 190 50 L 200 52 L 205 58 L 210 65 L 208 75 L 205 85 L 200 95 L 195 105 L 190 115 L 185 120 L 180 118 L 175 110 L 172 100 L 170 90 L 168 80 L 165 70 L 165 60 Z',
    'M 200 22 L 215 18 L 230 15 L 250 18 L 265 20 L 280 25 L 290 22 L 305 25 L 315 30 L 320 35 L 315 40 L 310 45 L 300 48 L 290 50 L 280 52 L 270 55 L 260 52 L 250 48 L 240 45 L 230 42 L 220 40 L 210 38 L 205 35 L 200 30 Z',
    'M 290 100 L 305 95 L 320 98 L 328 105 L 325 112 L 318 118 L 310 120 L 300 118 L 292 112 L 288 105 Z',
  ]

  let {
    points, connections, projection: _projection = 'equirectangular', showLabels, interactive, onPointClick,
    onPointHover, height, motion, class: className, style, ref = $bindable(null), ...rest
  }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)
  const allValues = $derived(points.map(p => p.value).filter((v): v is number => v !== undefined))
  const pointMap = $derived(new Map(points.map(p => [p.id, p])))

  function radius(value: number | undefined): number {
    if (value === undefined) return 3
    return 2.5 + (value / Math.max(...allValues, 1)) * (6 - 2.5)
  }

  // Connections whose endpoints are missing are skipped, as React returns null for them.
  const paths = $derived((connections ?? []).flatMap((conn, i) => {
    const a = pointMap.get(conn.from)
    const b = pointMap.get(conn.to)
    if (!a || !b) return []
    const from = geoToSvg(a.lat, a.lng)
    const to = geoToSvg(b.lat, b.lng)
    const midX = (from.x + to.x) / 2
    const midY = (from.y + to.y) / 2 - Math.abs(to.x - from.x) * 0.15
    return [{ key: `conn-${i}`, d: `M ${from.x} ${from.y} Q ${midX} ${midY}, ${to.x} ${to.y}`, status: conn.status }]
  }))

  // style first, then height — React's spread order, so height wins.
  const styles = $derived(mergeStyles(style, height !== undefined ? { height: typeof height === 'number' ? `${height}px` : height } : null))
</script>

<ErrorBoundary>
  <div class={cn('ui-geo-map', className)} data-motion={motionLevel()} use:cssProps={styles} bind:this={ref} {...rest}>
    <svg viewBox="0 0 360 180" preserveAspectRatio="xMidYMid meet" role="img" aria-label={`Geographic map with ${points.length} point${points.length !== 1 ? 's' : ''}`}>
      <g class="ui-geo-map__world">{#each WORLD_PATHS as d, i (i)}<path {d} />{/each}</g>
      {#each paths as p (p.key)}<path class="ui-geo-map__connection" d={p.d} data-status={p.status || undefined} />{/each}
      {#each points as point (point.id)}
        {@const pos = geoToSvg(point.lat, point.lng)}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <circle
          class="ui-geo-map__point"
          cx={pos.x}
          cy={pos.y}
          r={radius(point.value)}
          data-status={point.status || undefined}
          data-interactive={interactive ? '' : undefined}
          onclick={interactive ? () => onPointClick?.(point) : undefined}
          onmouseenter={interactive ? () => onPointHover?.(point) : undefined}
          onmouseleave={interactive ? () => onPointHover?.(null) : undefined}
        />
      {/each}
      {#if showLabels}
        {#each points as point (point.id)}
          {#if point.label}
            {@const pos = geoToSvg(point.lat, point.lng)}
            <text class="ui-geo-map__label" x={pos.x} y={pos.y + 6}>{point.label}</text>
          {/if}
        {/each}
      {/if}
    </svg>
  </div>
</ErrorBoundary>
