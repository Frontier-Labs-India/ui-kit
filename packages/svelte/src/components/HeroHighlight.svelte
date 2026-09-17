<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    children?: Snippet
    motion?: MotionLevel
    class?: string
  }

  let { children, motion, class: className, ref = $bindable(null), ...rest }: Props = $props()
  const motionLevel = getMotionLevel(() => motion)
</script>

<div class={cn('ui-hero-highlight', className)} data-motion={motionLevel()} bind:this={ref} {...rest}>{#if children}{@render children()}{/if}</div>
