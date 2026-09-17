<script lang="ts">
  import PluginDashboard from '../../src/components/PluginDashboard.svelte'
  import DashboardTemplate from '../../src/components/DashboardTemplate.svelte'
  let { data }: { data: Record<string, unknown> } = $props()
</script>

{#snippet custom(d: Record<string, unknown>)}<em class="custom">{String(d.who)}</em>{/snippet}
{#snippet plain()}<b class="plain">zero-arg</b>{/snippet}

<PluginDashboard config={{ name: 'P', metrics: [], charts: [], properties: [], widgets: [{ id: 'c', type: 'custom', title: 'Custom', render: custom }] }} {data} />
<DashboardTemplate sections={[{ id: 's', title: 'S', content: plain }]} />
