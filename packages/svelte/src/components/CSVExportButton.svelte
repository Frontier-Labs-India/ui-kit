<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLButtonAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends HTMLButtonAttributes {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLButtonElement | null
    data: Record<string, unknown>[]
    filename?: string
    columns?: { key: string; label: string }[]
    onExport?: () => void
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    motion?: MotionLevel
    disabled?: boolean
    children?: Snippet
    class?: string
  }

  let {
    data, filename = 'export.csv', columns, onExport, size = 'md', motion, class: className, disabled, children, onclick, ref = $bindable(null), ...rest
  }: Props = $props()

  function escapeCSV(val: unknown): string {
    const str = val == null ? '' : String(val)
    return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str.replace(/"/g, '""')}"` : str
  }
  function generateCSV(rows: Record<string, unknown>[]): string {
    if (rows.length === 0) return ''
    const cols = columns ?? Object.keys(rows[0]).map(k => ({ key: k, label: k }))
    return [cols.map(c => escapeCSV(c.label)).join(','), ...rows.map(r => cols.map(c => escapeCSV(r[c.key])).join(','))].join('\n')
  }

  const cls = makeCls('csv-export')
  const motionLevel = getMotionLevel(() => motion)
  let exported = $state(false)
  let timer: ReturnType<typeof setTimeout> | undefined
  $effect(() => () => { if (timer) clearTimeout(timer) })

  function handleClick(e: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
    if (disabled || data.length === 0) return
    const url = URL.createObjectURL(new Blob([generateCSV(data)], { type: 'text/csv;charset=utf-8;' }))
    const link = document.createElement('a')
    link.href = url
    link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
    link.click()
    URL.revokeObjectURL(url)
    exported = true
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => { exported = false }, 2000)
    onExport?.()
    onclick?.(e)
  }
</script>

<button type="button" class={cn(cls('root'), className)} data-size={size} data-motion={motionLevel()} data-exported={exported || undefined} {disabled} onclick={handleClick} bind:this={ref} {...rest}>
  {#if exported}
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
  {:else}
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 2v8m0 0l-3-3m3 3l3-3M3 12h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
  {/if}
  {#if children}{@render children()}{:else}{exported ? 'Exported!' : 'Export CSV'}{/if}
</button>
