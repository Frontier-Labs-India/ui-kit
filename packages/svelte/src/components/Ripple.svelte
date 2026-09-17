<script lang="ts" module>
  // Module-wide, as React's rippleCounter: ids stay unique across instances.
  let rippleCounter = 0
</script>

<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import { cssProps } from '../actions/css-props.js'
  import { mergeStyles, reactStyle, type StyleInput } from '../lib/react-style.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'style'> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    color?: string
    duration?: number
    children?: Snippet
    motion?: MotionLevel
    style?: StyleInput
    class?: string
  }

  let { color, duration = 600, children, motion, class: className, style, onclick, ref = $bindable(null), ...rest }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)
  const el = $derived(ref)
  let ripples = $state<{ id: number; x: number; y: number; size: number }[]>([])

  function handleClick(e: MouseEvent & { currentTarget: EventTarget & HTMLDivElement }) {
    onclick?.(e)
    if (motionLevel() === 0 || !el) return
    const rect = el.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const ripple = { id: ++rippleCounter, x: e.clientX - rect.left - size / 2, y: e.clientY - rect.top - size / 2, size }
    ripples = [...ripples, ripple]
    setTimeout(() => (ripples = ripples.filter(r => r.id !== ripple.id)), duration)
  }

  const styles = $derived(mergeStyles(style, {
    '--ripple-effect-duration': `${duration}ms`,
    ...(color ? { '--ripple-effect-color': color } : {}),
  }))
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div bind:this={ref} class={cn('ui-ripple', className)} data-motion={motionLevel()} onclick={handleClick} use:cssProps={styles} {...rest}>
  {#each ripples as r (r.id)}
    <!-- numbers, so React's px rule applies: inset/size are pixels -->
    <span class="ui-ripple--circle" use:cssProps={reactStyle({ insetInlineStart: r.x, insetBlockStart: r.y, inlineSize: r.size, blockSize: r.size })}></span>
  {/each}
  <div class="ui-ripple--content">{#if children}{@render children()}{/if}</div>
</div>
