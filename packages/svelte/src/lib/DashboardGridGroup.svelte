<script lang="ts">
  import Content from './Content.svelte'
  import type { DashboardGroup } from './dashboard-grid.js'

  /* One collapsible group. Each group owns its collapsed state, as React's
   * GridGroup does, starting from group.collapsed. Internal to DashboardGrid. */
  let { group }: { group: DashboardGroup } = $props()
  // svelte-ignore state_referenced_locally
  let collapsed = $state(group.collapsed ?? false)
</script>

<section class="ui-dashboard-grid__group" data-collapsed={collapsed ? '' : undefined}>
  <button type="button" class="ui-dashboard-grid__group-header" onclick={() => (collapsed = !collapsed)} aria-expanded={!collapsed}>
    <span class="ui-dashboard-grid__group-chevron">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M3 5l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
    </span>
    <h3 class="ui-dashboard-grid__group-title"><Content value={group.title} /></h3>
    {#if group.summary}<span class="ui-dashboard-grid__group-summary"><Content value={group.summary} /></span>{/if}
  </button>
  {#if group.description && !collapsed}<p class="ui-dashboard-grid__group-description">{group.description}</p>{/if}
  <div class="ui-dashboard-grid__group-content">
    <div class="ui-dashboard-grid__grid">
      {#each group.items as item, i (i)}<div class="ui-dashboard-grid__item"><Content value={item} /></div>{/each}
    </div>
  </div>
</section>
