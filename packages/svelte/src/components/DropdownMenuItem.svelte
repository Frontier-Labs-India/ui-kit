<script lang="ts">
  import type { Snippet } from 'svelte'
  import Content from '../lib/Content.svelte'
  import { getDropdownMenuContext } from '../lib/dropdown-menu-context.js'

  interface Props {
    /** The item's button (React's DropdownMenuItem takes no ref). Read it with `bind:ref`. */
    ref?: HTMLButtonElement | null
    icon?: string | Snippet
    shortcut?: string
    disabled?: boolean
    danger?: boolean
    onClick?: () => void
    children?: string | Snippet
  }

  let { icon, shortcut, disabled, danger, onClick, children, ref = $bindable(null) }: Props = $props()
  const ctx = getDropdownMenuContext()
</script>

<button
  bind:this={ref}
  type="button"
  role="menuitem"
  class="ui-dropdown-menu__item"
  tabindex="-1"
  aria-disabled={disabled ? 'true' : undefined}
  data-danger={danger ? 'true' : undefined}
  onclick={() => {
    if (disabled) return
    onClick?.()
    ctx?.close()
  }}
>{#if icon}<span class="ui-dropdown-menu__icon"><Content value={icon} /></span>{/if}<span class="ui-dropdown-menu__label-text"><Content value={children} /></span>{#if shortcut}<span class="ui-dropdown-menu__shortcut">{shortcut}</span>{/if}</button>
