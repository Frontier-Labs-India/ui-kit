<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import Content from '../lib/Content.svelte'

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    navbar?: string | Snippet
    sidebar?: string | Snippet
    footer?: string | Snippet
    sidebarCollapsed?: boolean
    sidebarPosition?: 'left' | 'right'
    children?: Snippet
    class?: string
  }

  let { navbar, sidebar, footer, sidebarCollapsed = false, sidebarPosition = 'left', children, class: className, ref = $bindable(null), ...rest }: Props = $props()

  // React reads the two differently and so must this: data-has-sidebar uses
  // `sidebar != null`, while the sidebar element renders only when truthy. An
  // empty-string sidebar therefore reports "true" with no sidebar element.
  const hasSidebar = $derived(sidebar != null)
</script>

<div
  class={cn('ui-app-shell', className)}
  data-has-sidebar={String(hasSidebar)}
  data-sidebar-position={sidebarPosition}
  data-sidebar-collapsed={String(sidebarCollapsed)}
  bind:this={ref}
  {...rest}
>
  {#if navbar}<div class="ui-app-shell__navbar"><Content value={navbar} /></div>{/if}
  {#if sidebar}<div class="ui-app-shell__sidebar"><Content value={sidebar} /></div>{/if}
  <div class="ui-app-shell__main">{#if children}{@render children()}{/if}</div>
  {#if footer}<div class="ui-app-shell__footer"><Content value={footer} /></div>{/if}
</div>
