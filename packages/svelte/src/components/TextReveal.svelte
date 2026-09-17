<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends HTMLAttributes<HTMLDivElement> {
    text: string
    trigger?: 'mount' | 'inView'
    /** Characters per second. */
    speed?: number
    motion?: MotionLevel
    class?: string
  }

  let { text, trigger = 'mount', speed = 30, motion, class: className, ...rest }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)
  let element = $state<HTMLDivElement | null>(null)
  let revealedCount = $state(0)
  let started = $state(false)
  const chars = $derived(Array.from(text))
  const instant = $derived(motionLevel() === 0)

  // Start on mount, or once 10% of the element is in view.
  $effect(() => {
    const length = chars.length
    if (instant) {
      revealedCount = length
      started = true
      return
    }
    if (trigger === 'mount') {
      started = true
      return
    }
    if (!element) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        started = true
        observer.disconnect()
      }
    }, { threshold: 0.1 })
    observer.observe(element)
    return () => observer.disconnect()
  })

  // One more character every 1000/speed ms.
  $effect(() => {
    if (!started || instant || revealedCount >= chars.length) return
    const timer = setTimeout(() => { revealedCount += 1 }, 1000 / speed)
    return () => clearTimeout(timer)
  })
</script>

<div bind:this={element} class={cn('ui-text-reveal', className)} data-motion={motionLevel()} aria-label={text} role="img" {...rest}>
  {#each chars as char, i}<span class="ui-text-reveal--char" data-revealed={i < revealedCount || undefined} data-space={char === ' ' || undefined} aria-hidden="true">{char === ' ' ? ' ' : char}</span>{/each}
</div>
