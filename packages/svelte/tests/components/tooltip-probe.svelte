<script lang="ts">
  import Tooltip from '../../src/components/Tooltip.svelte'
  let { content, ...rest }: { content: string } & Record<string, unknown> = $props()
</script>

<Tooltip {content} {...rest}>
  <button type="button">Trigger</button>
</Tooltip>
