<script lang="ts">
  import DropdownMenu, { type MenuItem } from '../../src/components/DropdownMenu.svelte'
  import DropdownMenuTrigger from '../../src/components/DropdownMenuTrigger.svelte'
  import DropdownMenuContent from '../../src/components/DropdownMenuContent.svelte'
  import DropdownMenuItem from '../../src/components/DropdownMenuItem.svelte'
  import DropdownMenuSeparator from '../../src/components/DropdownMenuSeparator.svelte'
  import { mergeProps } from '../../src/lib/trigger-props.js'

  let { composed = false, items = [], onOpenChange, onPick, placement = 'bottom-start' }: {
    composed?: boolean; items?: MenuItem[]; onOpenChange?: (open: boolean) => void; onPick?: (name: string) => void
    placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'
  } = $props()
  let ref = $state<Element | null>(null)
  let clicks = $state(0)
  export const getRef = () => ref
  export const getClicks = () => clicks
</script>

<button id="outside">Outside</button>
{#if composed}
  <DropdownMenu {onOpenChange} {placement} bind:ref>
    <DropdownMenuTrigger>
      {#snippet children(props)}<button id="trigger" {...mergeProps(props, { onclick: () => clicks++ })}>Menu</button>{/snippet}
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuItem onClick={() => onPick?.('one')}>One</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem disabled onClick={() => onPick?.('two')}>Two</DropdownMenuItem>
      <DropdownMenuItem onClick={() => onPick?.('three')}>Three</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
{:else}
  <DropdownMenu {items} {onOpenChange} {placement} bind:ref>
    {#snippet children(props)}<button id="trigger" {...mergeProps(props, { onclick: () => clicks++ })}>Menu</button>{/snippet}
  </DropdownMenu>
{/if}
