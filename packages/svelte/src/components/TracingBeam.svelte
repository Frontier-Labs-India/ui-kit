<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import { cssProps } from '../actions/css-props.js'
  import { mergeStyles, type StyleInput } from '../lib/react-style.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'style'> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    color?: string
    children?: Snippet
    motion?: MotionLevel
    class?: string
    style?: StyleInput
  }

  let { color, children, motion, class: className, style, ref = $bindable(null), ...rest }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)
  const element = $derived(ref)
  let progress = $state(0)

  // Percentage of the element scrolled past, from entering at the bottom to leaving at the top.
  $effect(() => {
    if (motionLevel() === 0 || !element) return
    const el = element
    const update = () => {
      const rect = el.getBoundingClientRect()
      const windowHeight = window.innerHeight
      if (rect.top >= windowHeight) { progress = 0; return }
      if (rect.top + rect.height <= 0) { progress = 100; return }
      progress = Math.min(100, Math.max(0, ((windowHeight - rect.top) / (windowHeight + rect.height)) * 100))
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update, { passive: true })
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  })

  const styles = $derived(mergeStyles(style, color ? { '--tracing-beam-color': color } : null))
</script>

<div bind:this={ref} class={cn('ui-tracing-beam', className)} data-motion={motionLevel()} use:cssProps={styles} {...rest}>
  <div class="ui-tracing-beam--track" aria-hidden="true">
    <div class="ui-tracing-beam--progress" use:cssProps={{ '--beam-progress': `${progress}%` }}></div>
    <div class="ui-tracing-beam--dot" use:cssProps={{ '--beam-progress': `${progress}%` }}></div>
  </div>
  <div class="ui-tracing-beam--content">{#if children}{@render children()}{/if}</div>
</div>
