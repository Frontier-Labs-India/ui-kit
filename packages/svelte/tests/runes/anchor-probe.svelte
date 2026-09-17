<script lang="ts">
  import { useAnchorPosition, type AnchorPlacement } from '../../src/runes/anchor-position.svelte.js'
  let { placement = 'bottom', offset = 8, enabled = true }: { placement?: AnchorPlacement; offset?: number; enabled?: boolean } = $props()
  let trigger = $state<HTMLElement | null>(null)
  let floating = $state<HTMLElement | null>(null)
  const pos = useAnchorPosition(() => trigger, () => floating, () => ({ placement, offset, enabled }))
</script>

<button bind:this={trigger} class="t">t</button>
<div bind:this={floating} class="f" data-x={pos.x} data-y={pos.y} data-placement={pos.placement}>f</div>
