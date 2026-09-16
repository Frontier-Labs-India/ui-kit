<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'onchange'> {
    page: number
    totalPages: number
    onChange: (page: number) => void
    siblingCount?: number
    showFirst?: boolean
    showPrevNext?: boolean
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    motion?: MotionLevel
    class?: string
  }

  type PageItem = number | 'ellipsis-start' | 'ellipsis-end'

  // Copied from React's getPageRange unchanged — the truncation rules are the contract.
  function getPageRange(page: number, totalPages: number, siblingCount: number): PageItem[] {
    if (totalPages <= 0) return []
    const totalNumbers = siblingCount * 2 + 5 // siblings + current + 2 boundaries + 2 ellipsis slots
    if (totalPages <= totalNumbers) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const leftSibling = Math.max(page - siblingCount, 1)
    const rightSibling = Math.min(page + siblingCount, totalPages)
    const showLeft = leftSibling > 2
    const showRight = rightSibling < totalPages - 1
    if (!showLeft && showRight) {
      const leftCount = siblingCount * 2 + 3
      return [...Array.from({ length: leftCount }, (_, i) => i + 1), 'ellipsis-end', totalPages]
    }
    if (showLeft && !showRight) {
      const rightCount = siblingCount * 2 + 3
      return [1, 'ellipsis-start', ...Array.from({ length: rightCount }, (_, i) => totalPages - rightCount + 1 + i)]
    }
    const middle = Array.from({ length: rightSibling - leftSibling + 1 }, (_, i) => leftSibling + i)
    return [1, 'ellipsis-start', ...middle, 'ellipsis-end', totalPages]
  }

  let {
    page, totalPages, onChange, siblingCount = 1, showFirst = false, showPrevNext = true, size = 'md', motion,
    class: className, ...rest
  }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)
  const pages = $derived(getPageRange(page, totalPages, siblingCount))
</script>

{#snippet chevron(d: string)}
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path {d} stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
{/snippet}

<nav class={cn('ui-pagination', className)} aria-label="Pagination" data-size={size} data-motion={motionLevel()} {...rest}>
  {#if showFirst}
    <button type="button" aria-label="First page" disabled={page <= 1} onclick={() => onChange(1)}>{@render chevron('M7 3L3 7L7 11M11 3L7 7L11 11')}</button>
  {/if}
  {#if showPrevNext}
    <button type="button" aria-label="Previous page" disabled={page <= 1} onclick={() => onChange(page - 1)}>{@render chevron('M9 3L5 7L9 11')}</button>
  {/if}
  {#each pages as item (item)}
    {#if item === 'ellipsis-start' || item === 'ellipsis-end'}
      <span class="ui-pagination__ellipsis" aria-hidden="true">…</span>
    {:else}
      <button
        type="button"
        aria-current={item === page ? 'page' : undefined}
        aria-label={`Page ${item}`}
        onclick={item === page ? undefined : () => onChange(item)}
      >{item}</button>
    {/if}
  {/each}
  {#if showPrevNext}
    <button type="button" aria-label="Next page" disabled={page >= totalPages} onclick={() => onChange(page + 1)}>{@render chevron('M5 3L9 7L5 11')}</button>
  {/if}
  {#if showFirst}
    <button type="button" aria-label="Last page" disabled={page >= totalPages} onclick={() => onChange(totalPages)}>{@render chevron('M3 3L7 7L3 11M7 3L11 7L7 11')}</button>
  {/if}
</nav>
