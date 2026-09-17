<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { untrack } from 'svelte'
  import { cn } from '../lib/cls.js'
  import ErrorBoundary from '../lib/ErrorBoundary.svelte'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends HTMLAttributes<HTMLSpanElement> {
    value: number
    previousValue?: number
    format?: (value: number) => string
    showDelta?: boolean
    flashOnChange?: boolean
    motion?: MotionLevel
    class?: string
  }

  const defaultFormat = (v: number) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(v)

  let { value, previousValue, format = defaultFormat, showDelta, flashOnChange = true, motion, class: className, ...rest }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)
  // svelte-ignore state_referenced_locally
  let displayValue = $state(value)
  // svelte-ignore state_referenced_locally
  let prev = value
  let flash = $state<'up' | 'down' | null>(null)
  let flashTimer: ReturnType<typeof setTimeout> | null = null

  /* On change: flash up/down for 600ms, and ease the shown number over 200ms
   * (400ms at motion 2+) — or jump at motion 0. Re-runs on value, flashOnChange
   * and motion, as React's effect does. */
  $effect(() => {
    const to = value
    const level = motionLevel()
    const flashes = flashOnChange
    const from = prev
    prev = to
    if (from === to) return
    return untrack(() => {
      if (flashes && level > 0) {
        flash = to > from ? 'up' : 'down'
        if (flashTimer) clearTimeout(flashTimer)
        flashTimer = setTimeout(() => { flash = null }, 600)
      }
      if (level === 0) {
        displayValue = to
        return
      }
      const duration = level >= 2 ? 400 : 200
      const start = performance.now()
      let raf = 0
      const animate = (now: number) => {
        const progress = Math.min((now - start) / duration, 1)
        displayValue = from + (to - from) * (1 - Math.pow(1 - progress, 3))
        if (progress < 1) raf = requestAnimationFrame(animate)
      }
      raf = requestAnimationFrame(animate)
      return () => {
        if (flashTimer) clearTimeout(flashTimer)
        cancelAnimationFrame(raf)
      }
    })
  })

  const delta = $derived(previousValue !== undefined ? value - previousValue : undefined)
  const deltaDirection = $derived(delta === undefined ? undefined : delta > 0 ? 'positive' : delta < 0 ? 'negative' : 'zero')
  const formatDelta = (d: number) => `${d > 0 ? '+' : ''}${format(d)}`
</script>

<ErrorBoundary>
  <span class={cn('ui-realtime-value', className)} data-motion={motionLevel()} data-flash={flash ?? undefined} aria-live="polite" {...rest}>
    <span class="ui-realtime-value__number">{format(displayValue)}</span>
    {#if showDelta && delta !== undefined}
      <span class="ui-realtime-value__delta" data-direction={deltaDirection} aria-label={`Change: ${formatDelta(delta)}`}>{formatDelta(delta)}</span>
    {/if}
  </span>
</ErrorBoundary>
