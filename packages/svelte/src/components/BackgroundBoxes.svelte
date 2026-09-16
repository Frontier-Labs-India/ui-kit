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
    rows?: number
    cols?: number
    children?: Snippet
    motion?: MotionLevel
    style?: StyleInput
    class?: string
  }

  let { rows = 15, cols = 15, children, motion, class: className, style, ...rest }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)
  const boxes = $derived(Array.from({ length: rows * cols }, (_, i) => reactStyle({
    '--box-delay': `${seededRandom(i + 1) * 8}s`,
    '--box-duration': `${3 + seededRandom(i + 100) * 5}s`,
    // a bare number on a custom property: React writes it without a unit
    '--box-intensity': 0.05 + seededRandom(i + 200) * 0.15,
  })))
  const styles = $derived(mergeStyles(style, {
    '--boxes-rows': `repeat(${rows}, 1fr)`,
    '--boxes-cols': `repeat(${cols}, 1fr)`,
  }))
</script>

<div class={cn('ui-background-boxes', className)} data-motion={motionLevel()} use:cssProps={styles} {...rest}>
  <div class="ui-background-boxes--grid" aria-hidden="true">
    {#each boxes as boxStyle, i (i)}<div class="ui-background-boxes--box" use:cssProps={boxStyle}></div>{/each}
  </div>
  {#if children}<div class="ui-background-boxes--content">{@render children()}</div>{/if}
</div>
