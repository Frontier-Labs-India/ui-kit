<script lang="ts">
  import type { Snippet } from 'svelte'
  import { formatBitRateSplit, type UpstreamLink } from './upstream-dashboard.js'

  /* React's CompactGroup and LinkGroup: the same collapsible section with its
   * own `collapsed` state, differing only in the grid class and the cards
   * inside it, which the parent passes as `card`. Rendered in an each block
   * keyed by group, so a group keeps its state while links update, as React's
   * key does. */
  interface Props {
    groupKey: string
    links: UpstreamLink[]
    gridClass: string
    card: Snippet<[UpstreamLink]>
    onGroupClick?: (groupName: string, links: UpstreamLink[]) => void
  }

  let { groupKey, links, gridClass, card, onGroupClick }: Props = $props()

  let collapsed = $state(false)
  const inFmt = $derived(formatBitRateSplit(links.reduce((s, l) => s + l.inbound, 0)))
  const outFmt = $derived(formatBitRateSplit(links.reduce((s, l) => s + l.outbound, 0)))
</script>

<section class="ui-upstream-dashboard__group" data-collapsed={collapsed ? '' : undefined}>
  <button
    type="button"
    class="ui-upstream-dashboard__group-header"
    onclick={() => { collapsed = !collapsed; onGroupClick?.(groupKey, links) }}
    aria-expanded={!collapsed}
  >
    <span class="ui-upstream-dashboard__group-chevron"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M3 5l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg></span>
    <h3 class="ui-upstream-dashboard__group-title">{groupKey}</h3>
    <span class="ui-upstream-dashboard__group-summary">{inFmt.value} {inFmt.unit} in / {outFmt.value} {outFmt.unit} out</span>
  </button>
  <div class="ui-upstream-dashboard__group-content">
    <div class={gridClass}>
      {#each links as link}{@render card(link)}{/each}
    </div>
  </div>
</section>
