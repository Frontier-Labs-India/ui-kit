<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import Content from '../lib/Content.svelte'
  import { getTabsContext } from '../lib/tabs-context.js'

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    children?: string | Snippet
    class?: string
  }

  let { children, class: className, ref = $bindable(null), ...rest }: Props = $props()
  const ctx = getTabsContext()

  // Roving focus over enabled tabs, written to the DOM as React does.
  function onkeydown(e: KeyboardEvent) {
    if (!ctx) return
    const vertical = ctx.orientation === 'vertical'
    const nextKey = vertical ? 'ArrowDown' : 'ArrowRight'
    const prevKey = vertical ? 'ArrowUp' : 'ArrowLeft'
    if (![nextKey, prevKey, 'Home', 'End', 'Enter', ' '].includes(e.key)) return
    e.preventDefault()
    const tabs = [...(ref?.querySelectorAll<HTMLElement>('[role="tab"]:not([aria-disabled="true"])') ?? [])]
    if (tabs.length === 0) return
    const current = tabs.indexOf(document.activeElement as HTMLElement)
    if (e.key === 'Enter' || e.key === ' ') { (document.activeElement as HTMLElement | null)?.click(); return }
    const target = e.key === 'Home' ? 0
      : e.key === 'End' ? tabs.length - 1
      : e.key === nextKey ? (current + 1 >= tabs.length ? 0 : current + 1)
      : (current - 1 < 0 ? tabs.length - 1 : current - 1)
    tabs[target]?.focus()
    tabs.forEach((el, i) => el.setAttribute('tabindex', i === target ? '0' : '-1'))
  }
</script>

<div class="ui-tabs__list-wrapper"><div bind:this={ref} role="tablist" aria-orientation={ctx?.orientation} class={cn('ui-tabs__list', className)} {onkeydown} {...rest}><Content value={children} /></div></div>
