<script lang="ts">
  import Tooltip from '../../components/Tooltip.svelte'
  let { content, ...rest }: { content: string } & Record<string, unknown> = $props()
</script>

<Tooltip {content} {...rest}>
  <button type="button">Trigger</button>
</Tooltip>
