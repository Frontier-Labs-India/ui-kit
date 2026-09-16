<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import Content from '../lib/Content.svelte'
  import ErrorBoundary from '../lib/ErrorBoundary.svelte'
  import { cssProps } from '../actions/css-props.js'
  import { mergeStyles, type StyleInput } from '../lib/react-style.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'style'> {
    value: number
    max?: number
    size?: 'sm' | 'md' | 'lg'
    thickness?: number
    color?: string
    label?: string | Snippet
    showValue?: boolean
    animated?: boolean
    motion?: MotionLevel
    style?: StyleInput
    class?: string
  }

  const SIZE_MAP = { sm: 48, md: 64, lg: 96 } as const
  const THICKNESS_MAP = { sm: 4, md: 6, lg: 8 } as const

  let {
    value: rawValue, max = 100, size = 'md', thickness, color = 'oklch(65% 0.2 270)', label,
    showValue = false, animated: _animated = true, motion, class: className, style, ...rest
  }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)
  const value = $derived(Math.max(0, Math.min(max, rawValue)))
  const percent = $derived((value / max) * 100)
  const svgSize = $derived(SIZE_MAP[size])
  const stroke = $derived(thickness ?? THICKNESS_MAP[size])
  const radius = $derived((svgSize - stroke) / 2)
  const circumference = $derived(2 * Math.PI * radius)
  const dashOffset = $derived(circumference - (percent / 100) * circumference)
  // The caller's style comes AFTER width/height in React's spread, so it wins.
  const styles = $derived(mergeStyles({ width: svgSize, height: svgSize }, style))
</script>

<ErrorBoundary>
  <div
    class={cn('ui-ring-chart', className)}
    data-size={size}
    data-motion={motionLevel()}
    role="meter"
    aria-valuenow={value}
    aria-valuemin={0}
    aria-valuemax={max}
    aria-label={typeof label === 'string' ? label : 'Ring chart'}
    use:cssProps={styles}
    {...rest}
  >
    <svg class="ui-ring-chart__svg" width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`} aria-hidden="true">
      <circle class="ui-ring-chart__track" cx={svgSize / 2} cy={svgSize / 2} r={radius} stroke-width={stroke} />
      <circle
        class="ui-ring-chart__fill"
        cx={svgSize / 2}
        cy={svgSize / 2}
        r={radius}
        stroke-width={stroke}
        stroke={color}
        stroke-dasharray={circumference}
        stroke-dashoffset={dashOffset}
      />
    </svg>
    {#if showValue || label}
      <!-- `??`, as React: only null/undefined fall back to the percentage; an
           empty-string label renders an empty centre. -->
      <div class="ui-ring-chart__center">{#if label != null}<Content value={label} />{:else}{Math.round(percent)}%{/if}</div>
    {/if}
  </div>
</ErrorBoundary>
