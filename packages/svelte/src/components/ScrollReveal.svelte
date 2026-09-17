<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'
  import { cssProps } from '../actions/css-props.js'
  import { mergeStyles, type StyleInput } from '../lib/react-style.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'style'> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    animation?: 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right' | 'scale' | 'none'
    delay?: number
    stagger?: number
    threshold?: number
    once?: boolean
    motion?: MotionLevel
    children?: Snippet
    class?: string
    style?: StyleInput
  }

  let { animation = 'fade-up', delay = 0, stagger, threshold = 0.1, once = true, motion, children, class: className, style, ref = $bindable(null), ...rest }: Props = $props()

  const cls = makeCls('scroll-reveal')
  const motionLevel = getMotionLevel(() => motion)
  const element = $derived(ref)
  let revealed = $state(false)
  let triggered = false

  /* Revealed at once at motion 0 or where CSS scroll-driven animations do the
   * work; otherwise when `threshold` of it is in view — hidden again on leaving
   * unless `once`. */
  $effect(() => {
    if (motionLevel() === 0) {
      revealed = true
      return
    }
    const el = element
    if (!el) return
    const isOnce = once
    const t = threshold
    if (isOnce && triggered) return
    if (typeof CSS !== 'undefined' && CSS?.supports?.('animation-timeline', 'view()')) {
      revealed = true
      return
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        revealed = true
        triggered = true
        if (isOnce) observer.disconnect()
      } else if (!isOnce) {
        revealed = false
      }
    }, { threshold: t })
    observer.observe(el)
    return () => observer.disconnect()
  })

  const styles = $derived(mergeStyles(
    style,
    delay > 0 ? { '--scroll-reveal-delay': `${delay}ms` } : null,
    stagger ? { '--stagger-delay': `${stagger}ms` } : null,
  ))
</script>

<div
  bind:this={ref}
  class={cn(cls('root'), className)}
  data-animation={animation}
  data-revealed={revealed || undefined}
  data-motion={motionLevel()}
  data-stagger={stagger || undefined}
  use:cssProps={styles}
  {...rest}
>{#if children}{@render children()}{/if}</div>
