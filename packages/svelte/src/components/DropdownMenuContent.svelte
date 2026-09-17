<script lang="ts">
  import type { Snippet } from 'svelte'
  import { getDropdownMenuContext } from '../lib/dropdown-menu-context.js'
  import DropdownMenuPanel from '../lib/DropdownMenuPanel.svelte'

  interface Props {
    /** The open menu's outer element, null while closed (React's DropdownMenuContent takes no ref). Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    children: Snippet
  }

  let { children, ref = $bindable(null) }: Props = $props()
  const ctx = getDropdownMenuContext()

  $effect(() => { ref = ctx?.isOpen ? ctx.root : null })
</script>

<!-- In a menu, the panel while open. React's DropdownMenu lifts its content into the
     panel wherever it is written; here the parts render in place, so write the
     Content after the Trigger, as React's examples do. Outside a menu, React renders
     the children as they are. -->
{#if ctx}{#if ctx.isOpen}<DropdownMenuPanel {ctx}>{@render children()}</DropdownMenuPanel>{/if}{:else}{@render children()}{/if}
