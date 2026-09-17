<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends HTMLAttributes<HTMLDivElement> {
    children?: Snippet
    motion?: MotionLevel
    class?: string
  }

  let { children, motion, class: className, onmousemove, onmouseenter, onmouseleave, ...rest }: Props = $props()

  const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  // Deterministic, so the server and client render the same matrix.
  const seeded = (seed: number) => {
    const x = Math.sin(seed * 9301 + 49297) * 233280
    return x - Math.floor(x)
  }
  const pick = (seed: number) => SCRAMBLE_CHARS[Math.floor(seeded(seed) * SCRAMBLE_CHARS.length)]

  const motionLevel = getMotionLevel(() => motion)
  let element = $state<HTMLDivElement | null>(null)
  let hovering = $state(false)
  let chars = $state(Array.from({ length: 600 }, (_, i) => pick(i + 1)))

  // Re-scramble every frame while hovered.
  $effect(() => {
    if (!hovering || motionLevel() === 0) return
    let frame = 0
    let raf = 0
    const scramble = () => {
      frame++
      chars = chars.map((_, i) => pick(i + frame * 7))
      raf = requestAnimationFrame(scramble)
    }
    raf = requestAnimationFrame(scramble)
    return () => cancelAnimationFrame(raf)
  })
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  bind:this={element}
  class={cn('ui-evervault-card', className)}
  data-motion={motionLevel()}
  onmousemove={e => {
    onmousemove?.(e)
    if (motionLevel() === 0 || !element) return
    const rect = element.getBoundingClientRect()
    element.style.setProperty('--ev-x', `${e.clientX - rect.left}px`)
    element.style.setProperty('--ev-y', `${e.clientY - rect.top}px`)
  }}
  onmouseenter={e => {
    onmouseenter?.(e)
    hovering = true
    element?.setAttribute('data-hovering', 'true')
  }}
  onmouseleave={e => {
    onmouseleave?.(e)
    hovering = false
    element?.removeAttribute('data-hovering')
  }}
  {...rest}
>
  <div class="ui-evervault-card--matrix" aria-hidden="true">{#each chars as char}<span class="ui-evervault-card--char">{char}</span>{/each}</div>
  <div class="ui-evervault-card--content">{#if children}{@render children()}{/if}</div>
</div>
