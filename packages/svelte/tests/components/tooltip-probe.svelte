<script lang="ts">
  import Tooltip from '../../src/components/Tooltip.svelte'
  let { content, ...rest }: { content: string } & Record<string, unknown> = $props()
</script>

<Tooltip {content} {...rest}>
  {#snippet children(props)}<button type="button" {...props}>Trigger</button>{/snippet}
</Tooltip>
