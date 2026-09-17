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
    perspective?: number
    maxTilt?: number
    glare?: boolean
    children?: Snippet
    motion?: MotionLevel
    style?: StyleInput
    class?: string
  }

  let {
    perspective = 1000, maxTilt = 10, glare = true, children, motion, class: className, style,
    onmousemove, onmouseleave, ref = $bindable(null), ...rest
  }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)
  let inner = $state<HTMLDivElement | null>(null)

  function handleMove(e: MouseEvent & { currentTarget: EventTarget & HTMLDivElement }) {
    onmousemove?.(e)
    if (motionLevel() === 0 || !inner) return
    const rect = inner.getBoundingClientRect()
    const mouseX = e.clientX - (rect.left + rect.width / 2)
    const mouseY = e.clientY - (rect.top + rect.height / 2)
    // Normalise to -1..1
    const normalX = mouseX / (rect.width / 2)
    const normalY = mouseY / (rect.height / 2)
    inner.style.setProperty('--tilt-x', `${-normalY * maxTilt}deg`) // Y inverted for a natural feel
    inner.style.setProperty('--tilt-y', `${normalX * maxTilt}deg`)
    if (glare) {
      const glareOpacity = Math.sqrt(normalX * normalX + normalY * normalY) * 0.15
      const glareAngle = Math.atan2(mouseY, mouseX) * (180 / Math.PI) + 90
      inner.style.setProperty('--glare-opacity', `${Math.min(glareOpacity, 0.2)}`)
      inner.style.setProperty('--glare-angle', `${glareAngle}deg`)
    }
  }

  function handleLeave(e: MouseEvent & { currentTarget: EventTarget & HTMLDivElement }) {
    onmouseleave?.(e)
    if (!inner) return
    inner.style.setProperty('--tilt-x', '0deg')
    inner.style.setProperty('--tilt-y', '0deg')
    inner.style.setProperty('--glare-opacity', '0')
  }

  const styles = $derived(mergeStyles(style, { '--card-3d-perspective': `${perspective}px` }))
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class={cn('ui-card-3d', className)}
  data-motion={motionLevel()}
  onmousemove={handleMove}
  onmouseleave={handleLeave}
  use:cssProps={styles}
  bind:this={ref}
  {...rest}
>
  <div bind:this={inner} class="ui-card-3d--inner">
    <div class="ui-card-3d--content">{#if children}{@render children()}{/if}</div>
    {#if glare}<div class="ui-card-3d--glare" aria-hidden="true"></div>{/if}
  </div>
</div>
