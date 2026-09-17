<script lang="ts">
  import NativeTooltip from '../../src/components/NativeTooltip.svelte'
  import { mergeProps } from '../../src/lib/trigger-props.js'

  let { content, show = true }: { content: string; show?: boolean } = $props()
  let ref = $state<Element | null>(null)
  let clicks = $state(0)
  export const getRef = () => ref
  export const getClicks = () => clicks
</script>

<NativeTooltip {content} bind:ref>
  {#snippet children(props)}
    {#if show}<button {...mergeProps(props, { onclick: () => clicks++ })}>Go</button>{/if}
  {/snippet}
</NativeTooltip>
