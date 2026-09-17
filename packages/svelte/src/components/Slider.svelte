<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'
  import { cssProps } from '../actions/css-props.js'
  import { reactStyle } from '../lib/react-style.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'onchange' | 'defaultValue'> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    min?: number
    max?: number
    step?: number
    /** Bindable. Omit it for an uncontrolled slider starting at defaultValue (or min). */
    value?: number
    defaultValue?: number
    onChange?: (value: number) => void
    label?: string
    showValue?: boolean
    showTicks?: boolean
    disabled?: boolean
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    motion?: MotionLevel
    class?: string
  }

  let {
    min = 0, max = 100, step = 1, value = $bindable(), defaultValue, onChange, label, showValue = false, showTicks = false,
    disabled = false, size = 'md', motion, class: className, ref = $bindable(null), ...rest
  }: Props = $props()

  const cls = makeCls('slider')
  const motionLevel = getMotionLevel(() => motion)
  // svelte-ignore state_referenced_locally
  let internal = $state(defaultValue ?? min)
  const current = $derived(value ?? internal)
  // Guard min === max, as React does.
  const fill = $derived(max === min ? 100 : ((current - min) / (max - min)) * 100)
  // Capped at 101 ticks so a fine step cannot render thousands.
  const ticks = $derived(showTicks ? Math.min(Math.floor((max - min) / step) + 1, 101) : 0)

  function set(v: number) {
    if (value !== undefined) value = v
    else internal = v
    onChange?.(v)
  }
  const track = $derived(reactStyle({
    background: `linear-gradient(to right, var(--brand, oklch(65% 0.2 270)) 0%, var(--brand, oklch(65% 0.2 270)) ${fill}%, var(--bg-surface, oklch(20% 0 0 / 0.3)) ${fill}%, var(--bg-surface, oklch(20% 0 0 / 0.3)) 100%)`,
  }))
</script>

<div class={cn(cls('root'), className)} data-size={size} data-motion={motionLevel()} data-disabled={disabled ? '' : undefined} bind:this={ref} {...rest}>
  {#if label || showValue}
    <div class="ui-slider__header">
      {#if label}<span class="ui-slider__label">{label}</span>{/if}
      {#if showValue}<span class="ui-slider__value">{current}</span>{/if}
    </div>
  {/if}
  <div class="ui-slider__track-container">
    <input
      type="range"
      class="ui-slider__input"
      {min}
      {max}
      {step}
      value={current}
      {disabled}
      oninput={e => set(Number(e.currentTarget.value))}
      aria-label={label || undefined}
      aria-valuenow={current}
      aria-valuemin={min}
      aria-valuemax={max}
      use:cssProps={track}
    />
  </div>
  {#if ticks}
    <div class="ui-slider__ticks" aria-hidden="true">{#each Array.from({ length: ticks }) as _, i (i)}<span class="ui-slider__tick"></span>{/each}</div>
  {/if}
</div>
