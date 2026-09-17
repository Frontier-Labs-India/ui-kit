<script lang="ts">
  import type { Snippet } from 'svelte'
  import Content from '../lib/Content.svelte'

  interface Props {
    /** The label element (React's DropdownMenuLabel takes no ref). Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    children?: string | Snippet
  }
  let { children, ref = $bindable(null) }: Props = $props()
</script>

<div bind:this={ref} role="presentation" class="ui-dropdown-menu__group-label"><Content value={children} /></div>
