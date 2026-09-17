<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends HTMLAttributes<HTMLSpanElement> {
    text: string
    trigger?: 'mount' | 'hover' | 'inView'
    /** Higher resolves faster: a character every round(4 / speed) frames. */
    speed?: number
    scrambleChars?: string
    motion?: MotionLevel
    class?: string
  }

  const DEFAULT_SCRAMBLE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'

  let { text, trigger = 'mount', speed = 2, scrambleChars = DEFAULT_SCRAMBLE, motion, class: className, onmouseenter, ...rest }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)
  let element = $state<HTMLSpanElement | null>(null)
  let resolvedCount = $state(0)
  let started = $state(false)
  let displayChars = $state<string[]>([])
  const chars = $derived(Array.from(text))
  const instant = $derived(motionLevel() === 0)
  const randomChar = () => scrambleChars[Math.floor(Math.random() * scrambleChars.length)]

  // Start scrambled — or resolved at motion 0 — whenever the text changes.
  $effect(() => {
    const cs = chars
    if (instant) {
      displayChars = cs
      resolvedCount = cs.length
      started = true
    } else {
      displayChars = cs.map(c => (c === ' ' ? ' ' : randomChar()))
    }
  })

  $effect(() => {
    if (instant || started) return
    if (trigger === 'mount') {
      started = true
      return
    }
    if (trigger !== 'inView' || !element) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        started = true
        observer.disconnect()
      }
    }, { threshold: 0.1 })
    observer.observe(element)
    return () => observer.disconnect()
  })

  /* Each frame re-scrambles the unresolved characters; every round(4 / speed)
   * frames one more resolves. Re-runs per resolved character, as React's
   * effect does. */
  $effect(() => {
    if (!started || instant || resolvedCount >= chars.length) return
    const count = resolvedCount
    const cs = chars
    const every = Math.max(1, Math.round(4 / speed))
    let frame = 0
    let raf = 0
    const animate = () => {
      frame++
      if (frame % every === 0) resolvedCount = Math.min(resolvedCount + 1, cs.length)
      displayChars = displayChars.map((_, i) => (i < count + 1 ? cs[i] : cs[i] === ' ' ? ' ' : randomChar()))
      raf = requestAnimationFrame(animate)
    }
    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  })
</script>

<span
  bind:this={element}
  class={cn('ui-encrypted-text', className)}
  data-motion={motionLevel()}
  aria-label={text}
  role="img"
  onmouseenter={e => {
    onmouseenter?.(e)
    if (trigger === 'hover' && !started) started = true
  }}
  {...rest}
>{#each displayChars as char, i}<span class="ui-encrypted-text--char" data-resolved={i < resolvedCount || undefined} data-scrambled={i >= resolvedCount || undefined} aria-hidden="true">{char === ' ' ? ' ' : char}</span>{/each}</span>
