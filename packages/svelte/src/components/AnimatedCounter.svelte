<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { untrack } from 'svelte'
  import { makeCls, cn } from '../lib/cls.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'
  import { solveSpring } from '../vendor/core/motion/spring.js'

  interface Props extends HTMLAttributes<HTMLSpanElement> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLSpanElement | null
    value: number
    format?: (value: number) => string
    duration?: number
    motion?: MotionLevel
    class?: string
  }

  let { value, format, duration = 500, motion, class: className, ref = $bindable(null), ...rest }: Props = $props()

  function defaultFormat(v: number): string {
    try {
      return new Intl.NumberFormat().format(Math.round(v))
    } catch {
      return String(Math.round(v))
    }
  }
  const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

  const cls = makeCls('animated-counter')
  const motionLevel = getMotionLevel(() => motion)
  const formatter = $derived(format || defaultFormat)
  // svelte-ignore state_referenced_locally
  let displayValue = $state(value)
  // svelte-ignore state_referenced_locally
  let prev = value
  const span = $derived(ref)
  let springCurve: number[] | null = null

  /* Animates from the previous value when `value` changes. Frames write the
   * span's text directly, as React does to avoid re-rendering 60 times a
   * second; the final value is committed to state. Only `value` triggers it:
   * motion, duration and format are read untracked, as React reads them
   * through refs. */
  $effect(() => {
    const to = value
    if (prev === to) return
    const from = prev
    prev = to
    return untrack(() => {
      const level = motionLevel()
      if (level === 0) {
        displayValue = to
        return
      }
      if (level >= 2 && !springCurve) springCurve = solveSpring({ stiffness: 120, damping: 14, mass: 1 })
      const curve = level >= 2 ? springCurve : null
      const total = duration
      const start = performance.now()
      let raf = 0
      const tick = (now: number) => {
        const progress = Math.min((now - start) / total, 1)
        const eased = curve
          ? curve[Math.min(Math.floor(progress * (curve.length - 1)), curve.length - 1)]
          : easeOut(progress)
        if (span) span.textContent = formatter(from + (to - from) * eased)
        if (progress < 1) raf = requestAnimationFrame(tick)
        else displayValue = to
      }
      raf = requestAnimationFrame(tick)
      return () => cancelAnimationFrame(raf)
    })
  })
</script>

<span bind:this={ref} class={cn(cls('root'), className)} role="status" aria-live="polite" data-motion={motionLevel()} {...rest}>{formatter(displayValue)}</span>
