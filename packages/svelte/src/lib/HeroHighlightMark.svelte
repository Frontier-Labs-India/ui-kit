<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from './cls.js'
  import { cssProps } from '../actions/css-props.js'
  import { mergeStyles, type StyleInput } from './react-style.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  /* React's public `Highlight` (src/domain/hero-highlight.tsx): an inline span
   * whose brand-colour sweep starts once 10% of it is in view, or at once at
   * motion 0. It lives in lib/ because components/Highlight.svelte is the text
   * highlighter React exports as TextHighlight. */
  interface Props extends Omit<HTMLAttributes<HTMLSpanElement>, 'style'> {
    children?: Snippet
    color?: string
    motion?: MotionLevel
    class?: string
    style?: StyleInput
  }

  let { children, color, motion, class: className, style, ...rest }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)
  let element = $state<HTMLSpanElement | null>(null)
  let active = $state(false)

  $effect(() => {
    if (motionLevel() === 0) {
      active = true
      return
    }
    if (!element) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        active = true
        observer.disconnect()
      }
    }, { threshold: 0.1 })
    observer.observe(element)
    return () => observer.disconnect()
  })

  // React: { ...style, '--highlight-brand-color': color }
  const styles = $derived(mergeStyles(style, color ? { '--highlight-brand-color': color } : null))
</script>

<span bind:this={element} class={cn('ui-highlight', className)} data-motion={motionLevel()} data-active={active || undefined} use:cssProps={styles} {...rest}>{#if children}{@render children()}{/if}</span>
