<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import ErrorBoundary from '../lib/ErrorBoundary.svelte'
  import { cssProps } from '../actions/css-props.js'
  import { mergeStyles, reactStyle, type StyleInput } from '../lib/react-style.js'
  import { sparklinePaths } from '../lib/sparkline.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'style'> {
    data: number[]
    width?: number | string
    height?: number
    color?: string
    gradient?: boolean
    showTooltip?: boolean
    /** Accepted for API parity; React reads it nowhere, and nor does this. */
    animate?: boolean
    motion?: MotionLevel
    style?: StyleInput
    class?: string
  }

  let {
    data, width, height = 32, color, gradient = true, showTooltip = false, animate: _animate = true, motion,
    class: className, style, ...rest
  }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)
  let hovered = $state<number | null>(null)
  const VIEW_W = 100
  const stroke = $derived(color || 'oklch(65% 0.2 270)')
  const geo = $derived(sparklinePaths(data, VIEW_W, height, 2))
  const points = $derived(geo?.points ?? [])
  // Keyed on data length, as React: two sparklines of equal length share this id.
  const gradientId = $derived(`sparkline-grad-${data.length}`)
  const wrapper = $derived(mergeStyles(style, {
    ...(width !== undefined ? { width: typeof width === 'number' ? `${width}px` : width } : {}),
    '--sparkline-color': stroke,
  }))
  const tip = $derived.by(() => {
    if (!showTooltip || hovered === null || !points[hovered]) return null
    const p = points[hovered]
    return reactStyle({
      left: `${Math.min(Math.max((p.x / VIEW_W) * 100, 10), 90)}%`,
      top: `${(p.y / height) * 100}%`,
      transform: p.y < height * 0.3 ? 'translate(-50%, 8px)' : 'translate(-50%, calc(-100% - 8px))',
    })
  })
</script>

<ErrorBoundary>
  <div class={cn('ui-sparkline', className)} data-motion={motionLevel()} use:cssProps={wrapper} {...rest}>
    <svg viewBox={`0 0 ${VIEW_W} ${height}`} preserveAspectRatio="none" aria-hidden="true" use:cssProps={reactStyle({ width: '100%', height: `${height}px` })}>
      {#if gradient && geo}
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color={stroke} stop-opacity="0.3" />
            <stop offset="100%" stop-color={stroke} stop-opacity="0" />
          </linearGradient>
        </defs>
        <path class="ui-sparkline__area" d={geo.area} fill={`url(#${gradientId})`} />
      {/if}
      {#if geo}<path class="ui-sparkline__line" d={geo.line} stroke={stroke} />{/if}
      {#if hovered !== null && points[hovered]}<circle class="ui-sparkline__dot" cx={points[hovered].x} cy={points[hovered].y} r={3} />{/if}
      {#if showTooltip}
        {#each points as pt, i (i)}
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <rect class="ui-sparkline__hit-area" x={pt.x - VIEW_W / data.length / 2} y={0} width={VIEW_W / data.length} {height} onmouseenter={() => (hovered = i)} onmouseleave={() => (hovered = null)} />
        {/each}
      {/if}
    </svg>
    {#if tip && hovered !== null}<div class="ui-sparkline__tooltip" use:cssProps={tip}>{data[hovered]}</div>{/if}
  </div>
</ErrorBoundary>
