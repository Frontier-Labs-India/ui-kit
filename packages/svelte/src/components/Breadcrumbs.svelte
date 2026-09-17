<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import Content from '../lib/Content.svelte'

  export interface BreadcrumbItem {
    label: string | Snippet
    href?: string
    icon?: string | Snippet
  }

  interface Props extends HTMLAttributes<HTMLElement> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLElement | null
    items: BreadcrumbItem[]
    separator?: string | Snippet
    maxVisible?: number
    onNavigate?: (href: string) => void
    class?: string
  }

  let { items, separator, maxVisible, onNavigate, class: className, ref = $bindable(null), ...rest }: Props = $props()

  // Collapse, exactly as React computes it: the first item, then the last
  // (maxVisible - 1). React's own comment says "maxVisible - 2", but its code
  // keeps maxVisible - 1 — the code is the contract.
  const collapsed = $derived(maxVisible != null && items.length > maxVisible)
  const visible = $derived(collapsed ? [items[0], ...items.slice(items.length - (maxVisible! - 1))] : items)

  function handleClick(e: MouseEvent, href: string | undefined) {
    if (href && onNavigate) {
      e.preventDefault()
      onNavigate(href)
    }
  }
</script>

{#snippet sep()}
  <span class="ui-breadcrumbs__separator" aria-hidden="true">
    {#if separator != null}<Content value={separator} />{:else}
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path d="M4.5 2.5L7.5 6L4.5 9.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    {/if}
  </span>
{/snippet}

<nav class={cn('ui-breadcrumbs', className)} aria-label="Breadcrumb" bind:this={ref} {...rest}>
  <ol>
    {#each visible as item, index (index)}
      <li>
        {#if collapsed && index === 1}{@render sep()}<span class="ui-breadcrumbs__ellipsis">…</span>{/if}
        {#if index > 0}{@render sep()}{/if}
        {#if index === visible.length - 1}
          <span class="ui-breadcrumbs__current" aria-current="page"><Content value={item.icon} /><Content value={item.label} /></span>
        {:else}
          <a href={item.href ?? '#'} onclick={e => handleClick(e, item.href)}><Content value={item.icon} /><Content value={item.label} /></a>
        {/if}
      </li>
    {/each}
  </ol>
</nav>
