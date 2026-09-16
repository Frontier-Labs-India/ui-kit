<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import { cssProps } from '../actions/css-props.js'
  import { mergeStyles, type StyleInput } from '../lib/react-style.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'style'> {
    spotlightColor?: string
    children?: Snippet
    motion?: MotionLevel
    style?: StyleInput
    class?: string
  }

  let {
    spotlightColor, children, motion, class: className, style,
    onmousemove, onmouseenter, onmouseleave, ...rest
  }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)
  let el = $state<HTMLDivElement | null>(null)
  let hovering = $state(false)

  // The pointer position is written straight to the element, as React does, so
  // moving the mouse never re-renders. cssProps below only ever removes the
  // properties it set itself, so it cannot clear these.
  function handleMove(e: MouseEvent & { currentTarget: EventTarget & HTMLDivElement }) {
    onmousemove?.(e)
    if (motionLevel() === 0 || !el) return
    const rect = el.getBoundingClientRect()
    el.style.setProperty('--spotlight-x', `${e.clientX - rect.left}px`)
    el.style.setProperty('--spotlight-y', `${e.clientY - rect.top}px`)
  }
  function handleEnter(e: MouseEvent & { currentTarget: EventTarget & HTMLDivElement }) {
    onmouseenter?.(e)
    hovering = true
  }
  function handleLeave(e: MouseEvent & { currentTarget: EventTarget & HTMLDivElement }) {
    onmouseleave?.(e)
    hovering = false
  }

  const styles = $derived(mergeStyles(style, spotlightColor ? { '--spotlight-card-color': spotlightColor } : null))
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  bind:this={el}
  class={cn('ui-spotlight-card', className)}
  data-motion={motionLevel()}
  data-hovering={hovering ? 'true' : undefined}
  onmousemove={handleMove}
  onmouseenter={handleEnter}
  onmouseleave={handleLeave}
  use:cssProps={styles}
  {...rest}
>
  <div class="ui-spotlight-card--content">{#if children}{@render children()}{/if}</div>
</div>
