<script module lang="ts">
  import type { Snippet } from 'svelte'

  export interface FeedItem {
    id: string
    content: string | Snippet
    timestamp: number | Date
    type?: string
  }
</script>

<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import Content from '../lib/Content.svelte'
  import ErrorBoundary from '../lib/ErrorBoundary.svelte'
  import { cssProps } from '../actions/css-props.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends HTMLAttributes<HTMLDivElement> {
    items: FeedItem[]
    maxItems?: number
    autoScroll?: boolean
    paused?: boolean
    onPause?: () => void
    onResume?: () => void
    connectionStatus?: 'connected' | 'reconnecting' | 'offline'
    height?: string
    emptyMessage?: string | Snippet
    motion?: MotionLevel
    class?: string
  }

  let {
    items, maxItems = 50, autoScroll = true, paused, onPause: _onPause, onResume: _onResume, connectionStatus, height,
    emptyMessage, motion, class: className, ...rest
  }: Props = $props()

  const LABELS = { connected: 'Connected', reconnecting: 'Reconnecting', offline: 'Offline' }
  const formatTime = (ts: number | Date) =>
    (ts instanceof Date ? ts : new Date(ts)).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  const motionLevel = getMotionLevel(() => motion)
  let scroller = $state<HTMLDivElement | null>(null)
  // svelte-ignore state_referenced_locally
  let prevCount = items.length
  const visibleItems = $derived(items.slice(-maxItems))

  // Keep the newest item in view as items arrive, unless paused.
  $effect(() => {
    const count = items.length
    if (autoScroll && !paused && scroller && count > prevCount) scroller.scrollTop = scroller.scrollHeight
    prevCount = count
  })
</script>

<ErrorBoundary>
  <div
    class={cn('ui-live-feed', className)}
    data-motion={motionLevel()}
    data-paused={paused ? 'true' : undefined}
    data-connection={connectionStatus || undefined}
    aria-live="polite"
    {...rest}
  >
    {#if connectionStatus || paused}
      <div class="ui-live-feed__header">
        {#if connectionStatus}<div class="ui-live-feed__status"><span class="ui-live-feed__status-dot" aria-hidden="true"></span><span>{LABELS[connectionStatus]}</span></div>{/if}
        {#if paused}<span class="ui-live-feed__pause-badge">Paused</span>{/if}
      </div>
    {/if}
    <div class="ui-live-feed__scroll" bind:this={scroller} use:cssProps={{ 'block-size': height || null }}>
      {#if visibleItems.length === 0}
        <div class="ui-live-feed__empty">{#if emptyMessage}<Content value={emptyMessage} />{:else}No events{/if}</div>
      {:else}
        <div class="ui-live-feed__list">
          {#each visibleItems as item (item.id)}
            <div class="ui-live-feed__item" data-type={item.type || undefined}>
              <div class="ui-live-feed__item-content"><Content value={item.content} /></div>
              <span class="ui-live-feed__timestamp">{formatTime(item.timestamp)}</span>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</ErrorBoundary>
