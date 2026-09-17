<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'
  import { cssProps } from '../actions/css-props.js'
  import { reactStyle } from '../lib/react-style.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  type DensityValue = 'compact' | 'comfortable' | 'spacious'

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'onchange' | 'defaultValue'> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    /** Controlled when set. */
    value?: DensityValue
    defaultValue?: DensityValue
    onChange?: (value: DensityValue) => void
    size?: 'sm' | 'md'
    motion?: MotionLevel
    class?: string
  }

  const OPTIONS: DensityValue[] = ['compact', 'comfortable', 'spacious']
  // Line y-positions per icon, from React's three icon components.
  const LINES: Record<DensityValue, number[]> = { compact: [3, 6.5, 10, 13.5], comfortable: [3, 8, 13], spacious: [4.5, 11.5] }

  let { value, defaultValue = 'comfortable', onChange, size = 'md', motion, class: className, ref = $bindable(null), ...rest }: Props = $props()

  const cls = makeCls('density-selector')
  const motionLevel = getMotionLevel(() => motion)
  // svelte-ignore state_referenced_locally
  let internal = $state<DensityValue>(defaultValue)
  const current = $derived(value ?? internal)
  const activeIndex = $derived(OPTIONS.indexOf(current))

  function select(v: DensityValue) {
    if (value === undefined) internal = v
    onChange?.(v)
  }
</script>

<div role="radiogroup" aria-label="UI density" class={cn(cls('root'), className)} data-size={size} data-motion={motionLevel()} bind:this={ref} {...rest}>
  <div class="ui-density-selector__indicator" use:cssProps={reactStyle({ insetInlineStart: `calc(${activeIndex} * (100% / 3) + 3px)`, inlineSize: 'calc(100% / 3 - 4px)' })}></div>
  {#each OPTIONS as opt (opt)}
    <button type="button" role="radio" aria-checked={opt === current} aria-label={opt} data-active={opt === current || undefined} class="ui-density-selector__option" onclick={() => select(opt)}>
      <span class="ui-density-selector__icon">
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
          {#each LINES[opt] as y (y)}<line x1="2" y1={y} x2="14" y2={y} stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />{/each}
        </svg>
      </span>
      {#if size === 'md'}{opt}{/if}
    </button>
  {/each}
</div>
