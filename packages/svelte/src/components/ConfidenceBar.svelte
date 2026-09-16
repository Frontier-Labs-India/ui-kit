<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import Content from '../lib/Content.svelte'
  import ErrorBoundary from '../lib/ErrorBoundary.svelte'
  import { cssProps } from '../actions/css-props.js'
  import { reactStyle } from '../lib/react-style.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends HTMLAttributes<HTMLDivElement> {
    value: number
    label?: string | Snippet
    showValue?: boolean
    thresholds?: { low: number; medium: number }
    size?: 'sm' | 'md' | 'lg'
    motion?: MotionLevel
    class?: string
  }

  let {
    value, label, showValue = true, thresholds = { low: 0.3, medium: 0.7 }, size = 'md', motion,
    class: className, ...rest
  }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)
  const level = $derived(value < thresholds.low ? 'low' : value < thresholds.medium ? 'medium' : 'high')
  const percentage = $derived(Math.round(value * 100))
  // React: a string label names the meter; anything else falls back to 'Confidence'.
  const ariaLabel = $derived(label && typeof label === 'string' ? label : 'Confidence')
</script>

<ErrorBoundary>
  <div
    class={cn('ui-confidence-bar', className)}
    data-motion={motionLevel()}
    data-size={size}
    data-level={level}
    role="meter"
    aria-valuenow={value}
    aria-valuemin={0}
    aria-valuemax={1}
    aria-label={ariaLabel}
    {...rest}
  >
    {#if label || showValue}
      <div class="ui-confidence-bar__header">
        {#if label}<span class="ui-confidence-bar__label"><Content value={label} /></span>{/if}
        {#if showValue}<span class="ui-confidence-bar__value">{percentage}%</span>{/if}
      </div>
    {/if}
    <div class="ui-confidence-bar__track">
      <div class="ui-confidence-bar__fill" use:cssProps={reactStyle({ inlineSize: `${percentage}%` })}></div>
    </div>
  </div>
</ErrorBoundary>
