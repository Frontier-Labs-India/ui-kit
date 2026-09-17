<script lang="ts">
  import Popover from '../../src/components/Popover.svelte'
  import { mergeProps } from '../../src/lib/trigger-props.js'

  let { onOpenChange, open, modal = false, placement = 'bottom' }: {
    onOpenChange?: (open: boolean) => void; open?: boolean; modal?: boolean; placement?: 'top' | 'bottom' | 'left' | 'right'
  } = $props()
  let ref = $state<Element | null>(null)
  let clicks = $state(0)
  export const getRef = () => ref
  export const getClicks = () => clicks
</script>

<button id="outside">Outside</button>
{#snippet panelContent()}<button id="inner">Inside</button>{/snippet}
<Popover content={panelContent} {open} {onOpenChange} {modal} {placement} bind:ref>
  {#snippet children(props)}
    <button id="trigger" {...mergeProps(props, { onclick: () => clicks++ })}>Open</button>
  {/snippet}
</Popover>
