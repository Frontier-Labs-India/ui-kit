<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import ErrorBoundary from '../lib/ErrorBoundary.svelte'
  import { cssProps } from '../actions/css-props.js'
  import { reactStyle } from '../lib/react-style.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  export interface MountInfo {
    mount: string
    totalBytes: number
    usedBytes: number
    freeBytes: number
    utilPct: number
  }

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    mounts: MountInfo[]
    maxVisible?: number
    showFree?: boolean
    formatBytes?: (bytes: number) => string
    size?: 'sm' | 'md' | 'lg'
    motion?: MotionLevel
    class?: string
  }

  function defaultFormat(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`
    if (bytes < 1024 ** 4) return `${(bytes / 1024 ** 3).toFixed(1)} GB`
    return `${(bytes / 1024 ** 4).toFixed(1)} TB`
  }
  const level = (pct: number) => (pct >= 90 ? 'critical' : pct >= 70 ? 'warning' : 'ok')
  const s = (n: number) => (n !== 1 ? 's' : '')

  let { mounts, maxVisible = 3, showFree = false, formatBytes, size = 'md', motion, class: className, ref = $bindable(null), ...rest }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)
  let expanded = $state(false)
  const fmt = $derived(formatBytes ?? defaultFormat)
  // Fullest first.
  const sorted = $derived([...mounts].sort((a, b) => b.utilPct - a.utilPct))
  const visible = $derived(expanded ? sorted : sorted.slice(0, maxVisible))
  const hidden = $derived(sorted.length - maxVisible)
</script>

<ErrorBoundary>
  <div class={cn('ui-disk-mount-bar', className)} data-size={size} data-motion={motionLevel()} role="list" aria-label={`Disk utilization — ${sorted.length} mount${s(sorted.length)}`} bind:this={ref} {...rest}>
    <div class="ui-disk-mount-bar__list">
      {#each visible as m (m.mount)}
        <div class="ui-disk-mount-bar__entry" role="listitem">
          <div class="ui-disk-mount-bar__header">
            <span class="ui-disk-mount-bar__mount" title={m.mount}>{m.mount}</span>
            <span class="ui-disk-mount-bar__info">
              <span>{fmt(m.usedBytes)} / {fmt(m.totalBytes)}</span>
              <span class="ui-disk-mount-bar__pct">{m.utilPct.toFixed(1)}%</span>
            </span>
          </div>
          <div class="ui-disk-mount-bar__track" role="progressbar" aria-valuenow={m.utilPct} aria-valuemin={0} aria-valuemax={100} aria-label={`${m.mount}: ${m.utilPct.toFixed(1)}% used`}>
            <!-- At least 0.5% wide, so an almost-empty mount still shows a sliver. -->
            <div class="ui-disk-mount-bar__fill" data-level={level(m.utilPct)} use:cssProps={reactStyle({ inlineSize: `${Math.max(m.utilPct, 0.5)}%` })}></div>
          </div>
          {#if showFree}<span class="ui-disk-mount-bar__free">{fmt(m.freeBytes)} free</span>{/if}
        </div>
      {/each}
    </div>
    {#if hidden > 0}
      <button type="button" class="ui-disk-mount-bar__toggle" onclick={() => (expanded = !expanded)} aria-expanded={expanded}>
        <span class="ui-disk-mount-bar__toggle-icon" data-expanded={expanded} aria-hidden="true">&#9660;</span>{expanded ? 'Show less' : `Show ${hidden} more mount${s(hidden)}`}
      </button>
    {/if}
    <div class="ui-disk-mount-bar__footer"><span>{sorted.length} mount point{s(sorted.length)}</span></div>
  </div>
</ErrorBoundary>
