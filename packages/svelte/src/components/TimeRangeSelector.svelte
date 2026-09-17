<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import ErrorBoundary from '../lib/ErrorBoundary.svelte'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  export interface TimeRangePreset {
    label: string
    value: string
    range: [number, number]
  }

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    presets?: TimeRangePreset[]
    value?: [number, number]
    onChange?: (range: [number, number]) => void
    showCustom?: boolean
    motion?: MotionLevel
    class?: string
  }

  let { presets: presetsProp, value, onChange, showCustom = false, motion, class: className, ref = $bindable(null), ...rest }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)

  // Default presets are computed once per instance, relative to mount time —
  // React keeps them in a ref for the same reason: re-computing on every render
  // would move the ranges and make a matching `value` stop matching.
  function makeDefaultPresets(): TimeRangePreset[] {
    const now = Date.now()
    return [
      { label: '1h', value: '1h', range: [now - 3600000, now] },
      { label: '24h', value: '24h', range: [now - 86400000, now] },
      { label: '7d', value: '7d', range: [now - 604800000, now] },
      { label: '30d', value: '30d', range: [now - 2592000000, now] },
    ]
  }
  let defaults: TimeRangePreset[] | null = null
  const presets = $derived(presetsProp ?? (defaults ??= makeDefaultPresets()))

  const isActive = (p: TimeRangePreset) => !!value && value[0] === p.range[0] && value[1] === p.range[1]

  function toDatetimeLocal(ts: number): string {
    const d = new Date(ts)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  function customStart(e: Event & { currentTarget: HTMLInputElement }) {
    const ts = new Date(e.currentTarget.value).getTime()
    if (!isNaN(ts) && onChange) onChange([ts, value?.[1] ?? Date.now()])
  }
  function customEnd(e: Event & { currentTarget: HTMLInputElement }) {
    const ts = new Date(e.currentTarget.value).getTime()
    if (!isNaN(ts) && onChange) onChange([value?.[0] ?? Date.now() - 86400000, ts])
  }
</script>

<ErrorBoundary>
  <div class={cn('ui-time-range-selector', className)} data-motion={motionLevel()} role="group" aria-label="Time range" bind:this={ref} {...rest}>
    <div class="ui-time-range-selector__presets" role="group" aria-label="Preset ranges">
      {#each presets as preset (preset.value)}
        <button
          class="ui-time-range-selector__preset"
          data-active={isActive(preset) ? 'true' : undefined}
          onclick={() => onChange?.(preset.range)}
          aria-pressed={isActive(preset)}
        >{preset.label}</button>
      {/each}
    </div>
    {#if showCustom}
      <div class="ui-time-range-selector__custom">
        <label>
          <span class="sr-only">Start time</span>
          <input type="datetime-local" class="ui-time-range-selector__input" aria-label="Start time" value={value ? toDatetimeLocal(value[0]) : ''} onchange={customStart} />
        </label>
        <span aria-hidden="true">—</span>
        <label>
          <span class="sr-only">End time</span>
          <input type="datetime-local" class="ui-time-range-selector__input" aria-label="End time" value={value ? toDatetimeLocal(value[1]) : ''} onchange={customEnd} />
        </label>
      </div>
    {/if}
  </div>
</ErrorBoundary>
