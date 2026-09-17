<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'
  import { cssProps } from '../actions/css-props.js'
  import { reactStyle } from '../lib/react-style.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    value?: number
    max?: number
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    variant?: 'default' | 'success' | 'warning' | 'danger'
    label?: string
    showValue?: boolean
    motion?: MotionLevel
    class?: string
  }

  let {
    value, max = 100, size = 'md', variant = 'default', label, showValue = false, motion,
    class: className, ref = $bindable(null), ...rest
  }: Props = $props()

  const cls = makeCls('progress')
  const motionLevel = getMotionLevel(() => motion)

  // Indeterminate only when value is undefined — 0 is a real, determinate value.
  const isIndeterminate = $derived(value === undefined)
  const clampedValue = $derived(isIndeterminate ? undefined : Math.min(Math.max(0, value!), max))
  const percentage = $derived(isIndeterminate ? undefined : Math.round((clampedValue! / max) * 100))
</script>

<div
  class={cn(cls('root'), className)}
  role="progressbar"
  aria-label={label}
  aria-valuenow={clampedValue}
  aria-valuemin={0}
  aria-valuemax={max}
  data-size={size}
  data-variant={variant}
  data-motion={motionLevel()}
  data-indeterminate={isIndeterminate ? '' : undefined}
  bind:this={ref}
  {...rest}
>
  <div class="ui-progress__track">
    <div class="ui-progress__fill" use:cssProps={isIndeterminate ? {} : reactStyle({ inlineSize: `${percentage}%` })}></div>
  </div>
  {#if showValue && !isIndeterminate}<span class="ui-progress__value">{percentage}%</span>{/if}
</div>
