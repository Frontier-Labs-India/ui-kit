<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends HTMLAttributes<HTMLElement> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLElement | null
    size?: 'xs' | 'sm' | 'md'
    variant?: 'default' | 'ghost'
    motion?: MotionLevel
    class?: string
    children?: Snippet
  }

  let { size = 'sm', variant = 'default', motion, class: className, children, ref = $bindable(null), ...rest }: Props = $props()

  const cls = makeCls('kbd')
  const motionLevel = getMotionLevel(() => motion)
</script>

<kbd
  class={cn(cls('root'), className)}
  data-size={size}
  data-variant={variant}
  data-motion={motionLevel()}
  bind:this={ref}
  {...rest}
>{#if children}{@render children()}{/if}</kbd>
