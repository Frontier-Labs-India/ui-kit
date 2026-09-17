<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAnchorAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends HTMLAnchorAttributes {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLAnchorElement | null
    variant?: 'default' | 'subtle' | 'brand'
    underline?: 'always' | 'hover' | 'none'
    external?: boolean
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    motion?: MotionLevel
    class?: string
    children?: Snippet
  }

  let {
    variant = 'default', underline = 'hover', external = false, size = 'md', motion,
    children, class: className, target, rel, ref = $bindable(null), ...rest
  }: Props = $props()

  const cls = makeCls('link')
  const motionLevel = getMotionLevel(() => motion)

  // External links open in a new tab with noopener unless the caller says
  // otherwise — `||`, as React, so an empty string also falls back.
  const resolvedTarget = $derived(external ? target || '_blank' : target)
  const resolvedRel = $derived(external ? rel || 'noopener noreferrer' : rel)
</script>

<a
  class={cn(cls('root'), className)}
  data-variant={variant}
  data-underline={underline}
  data-size={size}
  data-motion={motionLevel()}
  data-external={external || undefined}
  target={resolvedTarget}
  rel={resolvedRel}
  bind:this={ref}
  {...rest}
>{#if children}{@render children()}{/if}</a>
