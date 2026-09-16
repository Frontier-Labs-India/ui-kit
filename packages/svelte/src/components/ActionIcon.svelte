<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLButtonAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends HTMLButtonAttributes {
    variant?: 'filled' | 'light' | 'outline' | 'subtle' | 'transparent'
    color?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    radius?: 'sm' | 'md' | 'lg' | 'full'
    loading?: boolean
    disabled?: boolean
    /** Required: an icon button has no text of its own. */
    'aria-label': string
    children?: Snippet
    motion?: MotionLevel
    class?: string
  }

  let {
    variant = 'subtle', color = 'default', size = 'md', radius = 'md', loading = false, disabled,
    children, motion, class: className, type = 'button', ...rest
  }: Props = $props()

  const cls = makeCls('action-icon')
  const motionLevel = getMotionLevel(() => motion)
</script>

<button
  {type}
  {disabled}
  class={cn(cls('root'), className)}
  data-variant={variant}
  data-color={color}
  data-size={size}
  data-radius={radius}
  data-loading={loading || undefined}
  data-motion={motionLevel()}
  aria-busy={loading || undefined}
  aria-disabled={disabled || undefined}
  {...rest}
>{#if children}{@render children()}{/if}</button>
