<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import Content from '../lib/Content.svelte'
  import ErrorBoundary from '../lib/ErrorBoundary.svelte'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    value: number
    thresholds?: { warning: number; critical: number }
    label?: string | Snippet
    showValue?: boolean
    size?: 'sm' | 'md' | 'lg'
    motion?: MotionLevel
    class?: string
  }

  const SIZE_MAP = { sm: 80, md: 120, lg: 160 }
  const STROKE_MAP = { sm: 6, md: 8, lg: 10 }

  function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
  }
  function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
    const start = polarToCartesian(cx, cy, r, endAngle)
    const end = polarToCartesian(cx, cy, r, startAngle)
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`
  }

  let { value: rawValue, thresholds, label, showValue = false, size = 'md', motion, class: className, ref = $bindable(null), ...rest }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)
  const value = $derived(Math.max(0, Math.min(100, rawValue)))
  const status = $derived(
    !thresholds ? undefined : value >= thresholds.critical ? 'critical' : value >= thresholds.warning ? 'warning' : 'ok'
  )
  // Semicircle arc from 180° to 360°
  const svgSize = $derived(SIZE_MAP[size])
  const strokeWidth = $derived(STROKE_MAP[size])
  const cx = $derived(svgSize / 2)
  const cy = $derived(svgSize / 2)
  const r = $derived((svgSize - strokeWidth) / 2)
  const trackPath = $derived(describeArc(cx, cy, r, 180, 360))
  const fillPath = $derived(value > 0 ? describeArc(cx, cy, r, 180, 180 + (value / 100) * 180) : '')
</script>

<ErrorBoundary>
  <div
    class={cn('ui-threshold-gauge', className)}
    data-motion={motionLevel()}
    data-size={size}
    data-status={status}
    role="meter"
    aria-valuenow={value}
    aria-valuemin={0}
    aria-valuemax={100}
    aria-label={typeof label === 'string' ? label : 'Gauge'}
    bind:this={ref}
    {...rest}
  >
    <svg
      class="ui-threshold-gauge__svg"
      width={svgSize}
      height={svgSize / 2 + strokeWidth}
      viewBox={`0 0 ${svgSize} ${svgSize / 2 + strokeWidth}`}
      aria-hidden="true"
    >
      <path class="ui-threshold-gauge__track" d={trackPath} stroke-width={strokeWidth} />
      {#if fillPath}<path class="ui-threshold-gauge__fill" d={fillPath} stroke-width={strokeWidth} />{/if}
      {#if showValue}<text class="ui-threshold-gauge__value-text" x={cx} y={cy - strokeWidth * 0.5}>{value}</text>{/if}
    </svg>
    {#if label}<div class="ui-threshold-gauge__label"><Content value={label} /></div>{/if}
  </div>
</ErrorBoundary>
