<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import Content from '../lib/Content.svelte'

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    onLoadMore: () => void | Promise<void>
    hasMore: boolean
    loading?: boolean
    /** Distance in px before the end at which to load more (IntersectionObserver rootMargin). */
    threshold?: number
    loader?: string | Snippet
    endMessage?: string | Snippet
    direction?: 'down' | 'up'
    pullToRefresh?: boolean
    onRefresh?: () => void | Promise<void>
    children?: Snippet
    class?: string
  }

  let {
    onLoadMore, hasMore, loading = false, threshold = 200, loader, endMessage, direction = 'down', pullToRefresh = false,
    onRefresh, children, class: className, ref = $bindable(null), ...rest
  }: Props = $props()

  let sentinel = $state<HTMLDivElement | null>(null)
  // Set when a load starts, cleared when `loading` goes false: no duplicate calls in between.
  let inFlight = false
  $effect(() => { inFlight = loading })

  $effect(() => {
    if (!hasMore || !sentinel) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !inFlight) {
        inFlight = true
        onLoadMore()
      }
    }, { rootMargin: `${threshold}px` })
    observer.observe(sentinel)
    return () => observer.disconnect()
  })
</script>

{#snippet sentinelEl()}{#if hasMore}<div bind:this={sentinel} class="ui-infinite-scroll__sentinel" aria-hidden="true"></div>{/if}{/snippet}
{#snippet loaderEl()}{#if loading}<div class="ui-infinite-scroll__loader">{#if loader !== undefined && loader !== null}<Content value={loader} />{:else}<div class="ui-infinite-scroll__spinner"></div>{/if}</div>{/if}{/snippet}

<div class={cn('ui-infinite-scroll', className)} data-direction={direction} bind:this={ref} {...rest}>
  <div class="ui-infinite-scroll__status" aria-live="polite">{loading ? 'Loading more items...' : ''}</div>
  {#if pullToRefresh && onRefresh}<div class="ui-infinite-scroll__pull-indicator">Pull to refresh</div>{/if}
  {#if direction === 'up'}{@render sentinelEl()}{@render loaderEl()}{/if}
  <div class="ui-infinite-scroll__content">{#if children}{@render children()}{/if}</div>
  {#if direction === 'down'}{@render loaderEl()}{@render sentinelEl()}{/if}
  {#if !hasMore && endMessage}<div class="ui-infinite-scroll__end"><Content value={endMessage} /></div>{/if}
</div>
