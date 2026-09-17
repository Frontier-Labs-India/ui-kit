<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import { cssProps } from '../actions/css-props.js'
  import { mergeStyles, reactStyle, type StyleInput } from '../lib/react-style.js'
  import { seededRandom } from '../lib/seeded-random.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'style'> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    count?: number
    color?: string
    children?: Snippet
    motion?: MotionLevel
    style?: StyleInput
    class?: string
  }

  let { count = 6, color, children, motion, class: className, style, ref = $bindable(null), ...rest }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)
  const beams = $derived(Array.from({ length: count }, (_, i) => reactStyle({
    '--beam-angle': `${-60 + seededRandom(i + 1) * 120}deg`, // -60 to 60 degrees
    '--beam-delay': `${seededRandom(i + 50) * 6}s`,
    '--beam-duration': `${6 + seededRandom(i + 100) * 6}s`,
    '--beam-start-x': `${-300 + seededRandom(i + 150) * 600}px`,
    '--beam-end-x': `${-300 + seededRandom(i + 200) * 600}px`,
  })))
  const styles = $derived(mergeStyles(style, color ? { '--beam-color': color } : null))
</script>

<div class={cn('ui-background-beams', className)} data-motion={motionLevel()} use:cssProps={styles} bind:this={ref} {...rest}>
  {#each beams as beamStyle, i (i)}<div class="ui-background-beams--beam" aria-hidden="true" use:cssProps={beamStyle}></div>{/each}
  {#if children}<div class="ui-background-beams--content">{@render children()}</div>{/if}
</div>
