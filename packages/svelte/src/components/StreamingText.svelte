<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { untrack } from 'svelte'
  import { cn } from '../lib/cls.js'
  import ErrorBoundary from '../lib/ErrorBoundary.svelte'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends HTMLAttributes<HTMLDivElement> {
    text: string
    streaming?: boolean
    showCursor?: boolean
    /** Characters revealed per animation frame; omit to show text at once. */
    speed?: number
    onComplete?: () => void
    motion?: MotionLevel
    class?: string
  }

  let { text, streaming, showCursor, speed, onComplete, motion, class: className, ...rest }: Props = $props()

  type Segment = { type: 'text' | 'code'; content: string; language?: string }
  function parseText(value: string): Segment[] {
    const segments: Segment[] = []
    const codeBlock = /```(\w*)\n?([\s\S]*?)```/g
    let last = 0
    let match: RegExpExecArray | null
    while ((match = codeBlock.exec(value)) !== null) {
      if (match.index > last) segments.push({ type: 'text', content: value.slice(last, match.index) })
      segments.push({ type: 'code', content: match[2], language: match[1] || undefined })
      last = match.index + match[0].length
    }
    if (last < value.length) segments.push({ type: 'text', content: value.slice(last) })
    if (segments.length === 0) segments.push({ type: 'text', content: value })
    return segments
  }

  const motionLevel = getMotionLevel(() => motion)
  let wasStreaming = false
  let cursorFading = $state(false)
  // svelte-ignore state_referenced_locally
  let revealedCount = $state(speed ? 0 : text.length)
  const shouldShowCursor = $derived(showCursor !== undefined ? showCursor : streaming === true)

  // When streaming ends: fade the cursor out over 300ms and report completion.
  $effect(() => {
    const complete = onComplete
    if (streaming) {
      wasStreaming = true
      cursorFading = false
    } else if (wasStreaming) {
      wasStreaming = false
      cursorFading = true
      complete?.()
      const t = setTimeout(() => { cursorFading = false }, 300)
      return () => clearTimeout(t)
    }
  })

  /* Typewriter: `speed` more characters per frame until the text is shown.
   * Only text and speed re-run it; the count is read untracked, as React reads
   * its stale state. */
  $effect(() => {
    const full = text
    const step = speed
    return untrack(() => {
      if (!step) {
        revealedCount = full.length
        return
      }
      let count = revealedCount
      if (count > full.length) {
        revealedCount = full.length
        return
      }
      let raf = 0
      const advance = () => {
        count = Math.min(count + step, full.length)
        revealedCount = count
        if (count < full.length) raf = requestAnimationFrame(advance)
      }
      if (count < full.length) raf = requestAnimationFrame(advance)
      return () => cancelAnimationFrame(raf)
    })
  })

  const segments = $derived(parseText(speed ? text.slice(0, revealedCount) : text))
</script>

<ErrorBoundary>
  <div class={cn('ui-streaming-text', className)} data-motion={motionLevel()} aria-live="polite" aria-busy={streaming || undefined} {...rest}>
    <div class="ui-streaming-text__content">{#each segments as seg}{#if seg.type === 'code'}<code class="ui-streaming-text__code-block">{#if seg.language}<span class="ui-streaming-text__code-lang">{seg.language}</span>{/if}{seg.content}</code>{:else}<span>{seg.content}</span>{/if}{/each}{#if shouldShowCursor || cursorFading}<span class="ui-streaming-text__cursor" aria-hidden="true" data-fading={cursorFading ? 'true' : undefined}></span>{/if}</div>
  </div>
</ErrorBoundary>
