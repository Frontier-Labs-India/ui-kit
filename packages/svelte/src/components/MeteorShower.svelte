<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import { cssProps } from '../actions/css-props.js'
  import { reactStyle } from '../lib/react-style.js'
  import { seededRandom } from '../lib/seeded-random.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    count?: number
    children?: Snippet
    motion?: MotionLevel
    class?: string
  }

  let { count = 20, children, motion, class: className, ref = $bindable(null), ...rest }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)
  const meteors = $derived(Array.from({ length: count }, (_, i) => reactStyle({
    '--meteor-left': `${seededRandom(i + 1) * 100}%`,
    '--meteor-delay': `${seededRandom(i + 100) * 5}s`,
    '--meteor-duration': `${1.5 + seededRandom(i + 200) * 2}s`,
  })))
</script>

<div class={cn('ui-meteor-shower', className)} data-motion={motionLevel()} aria-hidden="true" bind:this={ref} {...rest}>
  {#each meteors as style, i (i)}<div class="ui-meteor-shower--meteor" use:cssProps={style}></div>{/each}
  {#if children}<div class="ui-meteor-shower--content">{@render children()}</div>{/if}
</div>
