<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import { cssProps } from '../actions/css-props.js'
  import { mergeStyles, type StyleInput } from '../lib/react-style.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'style'> {
    maxHeight: number
    showLabel?: string
    hideLabel?: string
    initialState?: 'hidden' | 'visible'
    transitionDuration?: number
    gradient?: boolean
    children?: Snippet
    motion?: MotionLevel
    class?: string
    style?: StyleInput
  }

  let {
    maxHeight, showLabel = 'Show more', hideLabel = 'Show less', initialState = 'hidden', transitionDuration = 350,
    gradient = true, children, motion, class: className, style, ...rest
  }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)
  let content = $state<HTMLDivElement | null>(null)
  // svelte-ignore state_referenced_locally
  let expanded = $state(initialState === 'visible')
  let shouldShowToggle = $state(false)
  let contentHeight = $state<number | undefined>(undefined)

  // The toggle appears only when the content is taller than maxHeight; re-measured on resize.
  $effect(() => {
    const el = content
    const limit = maxHeight
    if (!el) return
    const measure = () => {
      shouldShowToggle = el.scrollHeight > limit
      contentHeight = el.scrollHeight
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  })

  const currentMaxHeight = $derived(!shouldShowToggle ? undefined : expanded ? contentHeight : maxHeight)
  const styles = $derived(mergeStyles(style, { '--ui-spoiler-duration': `${transitionDuration}ms` }))
</script>

<div
  class={cn('ui-spoiler', className)}
  data-state={expanded ? 'visible' : 'hidden'}
  data-gradient={gradient ? undefined : 'false'}
  data-motion={motionLevel()}
  use:cssProps={styles}
  {...rest}
>
  <div bind:this={content} class="ui-spoiler__content" use:cssProps={{ 'max-height': currentMaxHeight !== undefined ? `${currentMaxHeight}px` : null }}>{#if children}{@render children()}{/if}</div>
  {#if shouldShowToggle}
    <button type="button" class="ui-spoiler__toggle" onclick={() => { expanded = !expanded }} aria-expanded={expanded}>
      {expanded ? hideLabel : showLabel}<span class="ui-spoiler__toggle-icon"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M3.5 5.25L7 8.75L10.5 5.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg></span>
    </button>
  {/if}
</div>
