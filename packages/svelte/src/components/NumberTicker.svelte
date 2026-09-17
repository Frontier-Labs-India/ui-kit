<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import { cssProps } from '../actions/css-props.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends HTMLAttributes<HTMLSpanElement> {
    value: number
    direction?: 'up' | 'down'
    /** ms before the first value shows; later changes show at once. */
    delay?: number
    motion?: MotionLevel
    class?: string
  }

  let { value, direction = 'up', delay = 0, motion, class: className, ...rest }: Props = $props()

  const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
  const REVERSED = [...DIGITS].reverse()

  const motionLevel = getMotionLevel(() => motion)
  // Null until the first effect, as in React: the server shows "0".
  let displayValue = $state<number | null>(null)
  let delayed = false

  $effect(() => {
    const v = value
    if (motionLevel() === 0 || delay <= 0) {
      displayValue = v
      delayed = true
      return
    }
    if (!delayed) {
      const t = setTimeout(() => {
        delayed = true
        displayValue = v
      }, delay)
      return () => clearTimeout(t)
    }
    displayValue = v
  })

  const chars = $derived(Array.from(displayValue === null ? '0' : new Intl.NumberFormat().format(displayValue)))
</script>

<span class={cn('ui-number-ticker', className)} data-motion={motionLevel()} aria-label={String(value)} role="img" {...rest}>
  {#each chars as char}
    {@const digit = DIGITS.indexOf(char)}
    {#if digit === -1}
      <span class="ui-number-ticker--static" aria-hidden="true">{char}</span>
    {:else}
      <span class="ui-number-ticker--digit-slot" aria-hidden="true"><span class="ui-number-ticker--digit-column" use:cssProps={{ transform: `translateY(${direction === 'up' ? -digit : -(9 - digit)}em)` }}>{#each direction === 'up' ? DIGITS : REVERSED as d (d)}<span class="ui-number-ticker--digit">{d}</span>{/each}</span></span>
    {/if}
  {/each}
</span>
