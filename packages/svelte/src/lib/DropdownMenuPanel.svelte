<script lang="ts">
  import type { Snippet } from 'svelte'
  import { cssProps } from '../actions/css-props.js'
  import { reactStyle } from './react-style.js'
  import type { DropdownMenuContext } from './dropdown-menu-context.js'

  // The open menu, shared by DropdownMenu's items path and DropdownMenuContent.
  let { ctx, children }: { ctx: DropdownMenuContext; children: Snippet } = $props()
</script>

<div
  bind:this={ctx.root}
  class="ui-dropdown-menu"
  data-placement={ctx.placement}
  data-motion={ctx.motionLevel}
  use:cssProps={reactStyle({ position: 'fixed', left: `${ctx.x}px`, top: `${ctx.y}px` })}
><div bind:this={ctx.menu} class="ui-dropdown-menu__panel" id={ctx.menuId} role="menu" tabindex="-1" onkeydown={ctx.onMenuKeyDown}>{@render children()}</div></div>
