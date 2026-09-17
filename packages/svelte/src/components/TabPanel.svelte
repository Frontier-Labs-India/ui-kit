<script lang="ts">
  import { onDestroy, type Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import Content from '../lib/Content.svelte'
  import { getPanelRegistry } from '../lib/tabs-context.js'

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    /** The element React's `ref` receives; null inside an array-API Tabs, which renders the panel. Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    tabId: string
    children?: string | Snippet
    class?: string
  }

  let { tabId, children, class: className, ref = $bindable(null), ...rest }: Props = $props()

  // Inside an array-API Tabs, React takes this panel's children and renders
  // them in its own panel; the TabPanel element itself never renders. Registered
  // synchronously, so server rendering sees it too (Tabs renders its children
  // before its panels).
  const registry = getPanelRegistry()
  if (registry) {
    const unregister = registry.register({ get tabId() { return tabId }, get content() { return children } })
    onDestroy(unregister)
  }
</script>

{#if !registry}<div bind:this={ref} class={cn('ui-tabs__panel-inner', className)} data-tab-id={tabId} {...rest}><Content value={children} /></div>{/if}
