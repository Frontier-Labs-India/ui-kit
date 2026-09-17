<script lang="ts" module>
  import type { Snippet } from 'svelte'

  export interface Tab {
    /** Unique identifier for the tab. */
    id: string
    /** Label content displayed on the tab button. */
    label: string | Snippet
    /** Leading icon rendered before the label. */
    icon?: string | number | Snippet
    /** When true, the tab cannot be selected. */
    disabled?: boolean
    /** Badge or count rendered after the label. */
    badge?: string | number | Snippet
    /** Shows a close button on this tab. */
    closeable?: boolean
  }
</script>

<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { SvelteMap } from 'svelte/reactivity'
  import { makeCls, cn } from '../lib/cls.js'
  import Content from '../lib/Content.svelte'
  import { setTabsContext, setPanelRegistry, type PanelEntry } from '../lib/tabs-context.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    /** Array-driven API: provide tab definitions. Omit to compose TabList/TabTrigger/TabContent. */
    tabs?: Tab[]
    /** Currently active tab ID (controlled). */
    activeTab?: string
    /** Initial active tab ID (uncontrolled). */
    defaultTab?: string
    /** Composed API alias for defaultTab. */
    defaultValue?: string
    /** Composed API alias for activeTab. */
    value?: string
    /** Callback fired when the active tab changes. */
    onChange?: (tabId: string) => void
    /** Callback fired when a closeable tab's close button is clicked. */
    onClose?: (tabId: string) => void
    variant?: 'underline' | 'pills' | 'enclosed'
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    orientation?: 'horizontal' | 'vertical'
    /** When true, inactive panels are not rendered. */
    lazy?: boolean
    motion?: MotionLevel
    /** Array API: TabPanel parts. Composed API: TabList, TabTrigger and TabContent. */
    children?: Snippet
    class?: string
  }

  let {
    tabs, activeTab, defaultTab, defaultValue, value, onChange, onClose, variant = 'underline', size = 'md',
    orientation = 'horizontal', lazy = false, motion, children, class: className, ref = $bindable(null), ...rest
  }: Props = $props()

  const cls = makeCls('tabs')
  const motionLevel = getMotionLevel(() => motion)
  const uid = $props.id()
  const baseId = `tabs-${uid}`

  const controlledValue = $derived(value ?? activeTab)
  // svelte-ignore state_referenced_locally
  let internalActive = $state(defaultValue ?? defaultTab ?? (tabs ? tabs[0]?.id : '') ?? '')
  const activeId = $derived(controlledValue ?? internalActive)

  function select(id: string) {
    if (controlledValue === undefined) internalActive = id
    onChange?.(id)
  }

  setTabsContext({
    get activeId() { return activeId },
    baseId,
    get orientation() { return orientation },
    onSelect: select,
  })

  // TabPanel parts register here (array API); React finds them among its children.
  const panels = new SvelteMap<object, PanelEntry>()
  setPanelRegistry({
    register(entry) {
      const key = {}
      panels.set(key, entry)
      return () => panels.delete(key)
    },
  })
  const panelFor = (id: string) => [...panels.values()].find(p => p.tabId === id)

  const enabledTabs = $derived(tabs?.filter(t => !t.disabled) ?? [])
  let tablist = $state<HTMLDivElement | null>(null)

  function clickTab(id: string) {
    if (tabs?.find(t => t.id === id)?.disabled) return
    select(id)
  }

  // Roving focus written to the DOM, over all tabs with disabled ones skipped, as in React.
  function onkeydown(e: KeyboardEvent) {
    if (!tabs) return
    const vertical = orientation === 'vertical'
    const nextKey = vertical ? 'ArrowDown' : 'ArrowRight'
    const prevKey = vertical ? 'ArrowUp' : 'ArrowLeft'
    if (![nextKey, prevKey, 'Home', 'End', 'Enter', ' '].includes(e.key)) return
    e.preventDefault()
    const all = [...(tablist?.querySelectorAll<HTMLElement>('[role="tab"]') ?? [])]
    const current = all.indexOf(document.activeElement as HTMLElement)
    if (current === -1 && !['Home', 'End'].includes(e.key)) return
    const enabled = tabs.reduce<number[]>((acc, t, i) => { if (!t.disabled) acc.push(i); return acc }, [])
    if (enabled.length === 0) return
    let target: number
    if (e.key === 'Home') target = enabled[0]
    else if (e.key === 'End') target = enabled[enabled.length - 1]
    else if (e.key === 'Enter' || e.key === ' ') {
      if (current >= 0) clickTab(tabs[current].id)
      return
    } else {
      const at = enabled.indexOf(current)
      target = e.key === nextKey ? enabled[at + 1 >= enabled.length ? 0 : at + 1] : enabled[at - 1 < 0 ? enabled.length - 1 : at - 1]
    }
    all[target]?.focus()
    all.forEach((el, i) => el.setAttribute('tabindex', i === target ? '0' : '-1'))
  }

  function tabIndexOf(tab: Tab): number {
    if (tab.disabled) return -1
    if (tab.id === activeId) return 0
    const activeInEnabled = enabledTabs.some(t => t.id === activeId)
    return !activeInEnabled && enabledTabs.findIndex(t => t.id === tab.id) === 0 ? 0 : -1
  }

  // React interpolates the label into a string; an element label becomes "[object Object]".
  const closeLabel = (label: Tab['label']) => `Close ${typeof label === 'function' ? '[object Object]' : label}`
</script>

<!-- `children` renders first and adds no markup in the array API (TabPanels register),
     so the panels below can use them, on the server too. Kept on one line with its
     siblings: line breaks would be text nodes React does not render. -->
<div
  bind:this={ref}
  class={cn(cls('root'), className)}
  data-variant={variant}
  data-size={size}
  data-orientation={orientation}
  data-motion={motionLevel()}
  {...rest}
>{#if tabs}{@render children?.()}<div class="ui-tabs__list-wrapper"><!-- svelte-ignore a11y_interactive_supports_focus (as React: the tabs carry the roving tabindex) --><div bind:this={tablist} role="tablist" aria-orientation={orientation} class="ui-tabs__list" {onkeydown}>{#each tabs as tab (tab.id)}<button
            id={`${baseId}-tab-${tab.id}`}
            role="tab"
            type="button"
            aria-selected={tab.id === activeId}
            aria-controls={`${baseId}-panel-${tab.id}`}
            aria-disabled={tab.disabled || undefined}
            tabindex={tabIndexOf(tab)}
            class="ui-tabs__tab"
            onclick={() => clickTab(tab.id)}
          >{#if tab.icon}<span class="ui-tabs__tab-icon"><Content value={tab.icon} /></span>{:else if tab.icon === 0}0{/if}<Content value={tab.label} />{#if tab.badge}<span class="ui-tabs__tab-badge"><Content value={tab.badge} /></span>{:else if tab.badge === 0}0{/if}{#if tab.closeable}<!-- svelte-ignore node_invalid_placement_ssr --><button
                type="button"
                class="ui-tabs__tab-close"
                onclick={e => { e.stopPropagation(); onClose?.(tab.id) }}
                aria-label={closeLabel(tab.label)}
              ><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 2l6 6m0-6l-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" /></svg></button>{/if}</button>{/each}</div></div><div class="ui-tabs__panels">{#each tabs as tab (tab.id)}{#if !lazy || tab.id === activeId}<div
            id={`${baseId}-panel-${tab.id}`}
            role="tabpanel"
            aria-labelledby={`${baseId}-tab-${tab.id}`}
            class="ui-tabs__panel"
            hidden={tab.id !== activeId}
            tabindex={tab.id === activeId ? 0 : -1}
          ><Content value={panelFor(tab.id)?.content} /></div>{/if}{/each}</div>{:else}{@render children?.()}{/if}</div>
