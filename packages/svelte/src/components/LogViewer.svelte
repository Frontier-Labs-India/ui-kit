<script module lang="ts">
  export interface LogLine {
    id: string | number
    timestamp?: number | Date
    level?: 'debug' | 'info' | 'warn' | 'error'
    message: string
  }
</script>

<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import ErrorBoundary from '../lib/ErrorBoundary.svelte'
  import { cssProps } from '../actions/css-props.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    lines: LogLine[]
    maxLines?: number
    autoTail?: boolean
    showTimestamp?: boolean
    showLevel?: boolean
    search?: string
    filterLevel?: string[]
    wrap?: boolean
    /** A CSS length; with more than 100 lines it also enables virtual scrolling. */
    height?: string
    motion?: MotionLevel
    class?: string
  }

  let {
    lines, maxLines, autoTail = false, showTimestamp = false, showLevel = false, search, filterLevel, wrap = false, height,
    motion, class: className, ref = $bindable(null), ...rest
  }: Props = $props()

  const LINE_HEIGHT = 21
  const OVERSCAN = 10
  const formatTimestamp = (ts: number | Date) =>
    (ts instanceof Date ? ts : new Date(ts)).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  /* React's highlighter, step for step. It tests each split part with the same
   * global regex; split alternates non-match and match parts and each failed
   * test resets lastIndex, so that marks exactly the matched parts. Returns the
   * parts with whether each is wrapped in <mark>; null means plain text. */
  function highlight(text: string, term: string): { text: string; mark: boolean }[] | null {
    if (!term) return null
    try {
      const regex = new RegExp(`(${escapeRegex(term)})`, 'gi')
      const parts = text.split(regex)
      if (parts.length === 1) return null
      return parts.map(part => ({ text: part, mark: regex.test(part) }))
    } catch {
      return null
    }
  }

  const motionLevel = getMotionLevel(() => motion)
  let scroller = $state<HTMLDivElement | null>(null)
  let scrollTop = $state(0)

  const filtered = $derived.by(() => {
    let result = lines
    if (filterLevel && filterLevel.length > 0) result = result.filter(l => l.level && filterLevel.includes(l.level))
    if (maxLines !== undefined) result = result.slice(-maxLines)
    return result
  })

  // svelte-ignore state_referenced_locally
  let prevCount = filtered.length
  $effect(() => {
    const count = filtered.length
    if (autoTail && scroller && count > prevCount) scroller.scrollTop = scroller.scrollHeight
    prevCount = count
  })

  const containerHeight = $derived(height ? parseInt(height, 10) || 300 : undefined)
  const useVirtual = $derived(containerHeight !== undefined && filtered.length > 100)
  const startIndex = $derived(useVirtual ? Math.max(0, Math.floor(scrollTop / LINE_HEIGHT) - OVERSCAN) : 0)
  const visibleCount = $derived(
    useVirtual ? Math.min(filtered.length - startIndex, Math.ceil(containerHeight! / LINE_HEIGHT) + OVERSCAN * 2) : filtered.length,
  )
  const visibleLines = $derived(useVirtual ? filtered.slice(startIndex, startIndex + visibleCount) : filtered)
</script>

<ErrorBoundary>
  <div class={cn('ui-log-viewer', className)} data-motion={motionLevel()} data-wrap={wrap ? 'true' : undefined} role="log" aria-live={autoTail ? 'polite' : undefined} bind:this={ref} {...rest}>
    <div
      bind:this={scroller}
      class="ui-log-viewer__scroll"
      use:cssProps={height ? { height, 'block-size': height } : {}}
      onscroll={useVirtual ? () => { if (scroller) scrollTop = scroller.scrollTop } : undefined}
    >
      {#if useVirtual}<div class="ui-log-viewer__virtual-spacer" use:cssProps={{ height: `${filtered.length * LINE_HEIGHT}px` }}></div>{/if}
      <div use:cssProps={useVirtual ? { position: 'absolute', top: '0', left: '0', right: '0', transform: `translateY(${startIndex * LINE_HEIGHT}px)` } : {}}>
        {#each visibleLines as line (line.id)}
          {@const parts = search ? highlight(line.message, search) : null}
          <div class="ui-log-viewer__line" data-line-level={line.level}>
            {#if showTimestamp && line.timestamp}<span class="ui-log-viewer__timestamp">{formatTimestamp(line.timestamp)}</span>{/if}
            {#if showLevel && line.level}<span class="ui-log-viewer__level" data-level={line.level}>{line.level}</span>{/if}
            <span class="ui-log-viewer__message">{#if parts}{#each parts as part}{#if part.mark}<mark>{part.text}</mark>{:else}{part.text}{/if}{/each}{:else}{line.message}{/if}</span>
          </div>
        {/each}
      </div>
    </div>
  </div>
</ErrorBoundary>
