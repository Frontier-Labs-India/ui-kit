<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends HTMLAttributes<HTMLSpanElement> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLSpanElement | null
    /** Semantic color variant (default: 'default') */
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
    /** Controls padding, font-size, and dimensions (default: 'md') */
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    /** Shows a small colored dot indicator (default: false) */
    dot?: boolean
    /** Adds pulsing animation to the dot; requires motion level 2+ (default: false) */
    pulse?: boolean
    /** Numeric count to display instead of children */
    count?: number
    /** Maximum count before overflow display, e.g. "99+" (default: 99) */
    maxCount?: number
    /** Leading icon rendered before content */
    icon?: Snippet
    /** Shows a remove (X) button (default: false) */
    removable?: boolean
    /** Called when the remove button is clicked */
    onRemove?: () => void
    /** Outline mode with transparent background (default: false) */
    outline?: boolean
    /** Animation intensity override: 0=none, 1=subtle, 2=expressive, 3=cinematic */
    motion?: MotionLevel
    class?: string
    children?: Snippet
  }

  let {
    variant = 'default',
    size = 'md',
    dot = false,
    pulse = false,
    count,
    maxCount = 99,
    icon,
    removable = false,
    onRemove,
    outline = false,
    motion,
    class: className,
    children,
    ref = $bindable(null),
    ...rest
  }: Props = $props()

  const cls = makeCls('badge')
  const motionLevel = getMotionLevel(() => motion)

  // `count !== undefined`, not `count ?` — a count of 0 must render as "0".
  const displayCount = $derived(
    count !== undefined ? (count > maxCount ? `${maxCount}+` : String(count)) : null
  )
</script>

<span
  class={cn(cls('root'), className)}
  data-variant={variant}
  data-size={size}
  data-motion={motionLevel()}
  data-outline={outline || undefined}
  bind:this={ref}
  {...rest}
>
  {#if icon}<span class="ui-badge__icon">{@render icon()}</span>{/if}
  {#if dot}<span class="ui-badge__dot" data-pulse={pulse || undefined}></span>{/if}
  {#if displayCount !== null}{displayCount}{:else if children}{@render children()}{/if}
  {#if removable}
    <button type="button" class="ui-badge__remove" onclick={onRemove} aria-label="Remove">
      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
        <path d="M1.5 1.5l5 5m0-5l-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
      </svg>
    </button>
  {/if}
</span>
