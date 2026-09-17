<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import Content from '../lib/Content.svelte'

  interface Props extends HTMLAttributes<HTMLElement> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLElement | null
    icon?: string | Snippet
    label: string
    active?: boolean
    /** With href the item is a link; without, a button. */
    href?: string
    onClick?: () => void
    collapsed?: boolean
    class?: string
  }

  let { icon, label, active, href, onClick, collapsed: _collapsed, class: className, ref = $bindable(null), ...rest }: Props = $props()
</script>

<svelte:element
  this={href ? 'a' : 'button'}
  class={cn('ui-sidebar__item', className)}
  data-active={active ? 'true' : undefined}
  onclick={onClick}
  href={href || undefined}
  type={href ? undefined : 'button'}
  bind:this={ref}
  {...rest}
>
  <!-- One line: a line break between the icon and the label renders as a space. -->
  {#if icon}<span class="ui-sidebar__item-icon"><Content value={icon} /></span>{/if}<span class="ui-sidebar__item-label">{label}</span>
</svelte:element>
