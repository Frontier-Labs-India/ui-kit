<script lang="ts">
  interface Props {
    /** The separator element (React's DropdownMenuSeparator takes no ref). Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
  }
  let { ref = $bindable(null) }: Props = $props()
</script>

<div bind:this={ref} role="separator" class="ui-dropdown-menu__separator"></div>
