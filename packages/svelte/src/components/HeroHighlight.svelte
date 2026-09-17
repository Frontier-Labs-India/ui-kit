<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends HTMLAttributes<HTMLDivElement> {
    children?: Snippet
    motion?: MotionLevel
    class?: string
  }

  let { children, motion, class: className, ...rest }: Props = $props()
  const motionLevel = getMotionLevel(() => motion)
</script>

<div class={cn('ui-hero-highlight', className)} data-motion={motionLevel()} {...rest}>{#if children}{@render children()}{/if}</div>
