<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    orientation?: 'horizontal' | 'vertical'
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    variant?: 'primary' | 'secondary' | 'ghost'
    attached?: boolean
    motion?: MotionLevel
    children?: Snippet
    class?: string
  }

  let {
    orientation = 'horizontal', size = 'md', variant = 'primary', attached = false, motion,
    children, class: className, role = 'group', ref = $bindable(null), ...rest
  }: Props = $props()

  const cls = makeCls('button-group')
  const motionLevel = getMotionLevel(() => motion)
</script>

<div
  {role}
  class={cn(cls('root'), className)}
  data-orientation={orientation}
  data-size={size}
  data-variant={variant}
  data-attached={attached || undefined}
  data-motion={motionLevel()}
  bind:this={ref}
  {...rest}
>
  {#if children}{@render children()}{/if}
</div>
