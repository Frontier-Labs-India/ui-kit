<script module lang="ts">
  import type { Snippet } from 'svelte'

  export interface SpotlightAction {
    id: string
    title: string
    description?: string
    icon?: string | Snippet
    group?: string
    keywords?: string[]
    onClick: () => void
  }

  /* Module scope, as in React: recent actions are shared by every Spotlight
   * on the page and survive closing and reopening. State, so the list shown on
   * reopening is current; React recomputes it only when `actions` or the query
   * changes identity, so a caller with a stable actions array sees it lag. */
  const recentActionIds = $state<string[]>([])
  const MAX_RECENT = 5
  function addRecentAction(id: string) {
    const idx = recentActionIds.indexOf(id)
    if (idx >= 0) recentActionIds.splice(idx, 1)
    recentActionIds.unshift(id)
    if (recentActionIds.length > MAX_RECENT) recentActionIds.pop()
  }
</script>

<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import Content from '../lib/Content.svelte'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import { useFocusTrap } from '../runes/focus-trap.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    actions: SpotlightAction[]
    open?: boolean
    onOpenChange?: (open: boolean) => void
    /** Default "meta+k". */
    shortcut?: string
    placeholder?: string
    nothingFoundMessage?: string
    limit?: number
    filter?: (query: string, actions: SpotlightAction[]) => SpotlightAction[]
    motion?: MotionLevel
    class?: string
  }

  let {
    actions, open = false, onOpenChange, shortcut = 'meta+k', placeholder = 'Search...', nothingFoundMessage = 'No results found',
    limit, filter, motion, class: className, ...rest
  }: Props = $props()

  function fuzzyMatch(query: string, target: string): boolean {
    const q = query.toLowerCase()
    const t = target.toLowerCase()
    let qi = 0
    for (let ti = 0; ti < t.length && qi < q.length; ti++) if (t[ti] === q[qi]) qi++
    return qi === q.length
  }
  function defaultFilter(query: string, list: SpotlightAction[]): SpotlightAction[] {
    if (!query) return list
    return list.filter(a =>
      fuzzyMatch(query, a.title) || (a.description && fuzzyMatch(query, a.description)) || a.keywords?.some(kw => fuzzyMatch(query, kw)),
    )
  }
  const parts = (s: string) => s.toLowerCase().split('+').map(p => p.trim())

  const motionLevel = getMotionLevel(() => motion)
  const uid = $props.id()
  const id = `spotlight-${uid}`
  const listboxId = `${id}-listbox`
  let overlay = $state<HTMLDivElement | null>(null)
  let input = $state<HTMLInputElement | null>(null)
  let list = $state<HTMLDivElement | null>(null)
  let query = $state('')
  let activeIndex = $state(0)

  useFocusTrap(() => overlay, () => ({ active: open, returnFocus: true, initialFocus: 'first' }))

  const filtered = $derived.by(() => {
    const result = (filter ?? defaultFilter)(query, actions)
    return limit && limit > 0 ? result.slice(0, limit) : result
  })

  type Entry = { type: 'section'; name: string } | { type: 'action'; action: SpotlightAction }
  const entries = $derived.by(() => {
    const result: Entry[] = []
    if (!query && recentActionIds.length > 0) {
      const recent = recentActionIds.map(rid => actions.find(a => a.id === rid)).filter(Boolean) as SpotlightAction[]
      if (recent.length > 0) {
        result.push({ type: 'section', name: 'Recent' })
        for (const action of recent) result.push({ type: 'action', action })
      }
    }
    if (filtered.some(a => a.group)) {
      const seen = new Set<string>()
      for (const action of filtered) {
        const group = action.group ?? ''
        if (group && !seen.has(group)) {
          seen.add(group)
          result.push({ type: 'section', name: group })
        }
        result.push({ type: 'action', action })
      }
    } else {
      for (const action of filtered) result.push({ type: 'action', action })
    }
    return result
  })
  const navigable = $derived(entries.flatMap(e => (e.type === 'action' ? [e.action] : [])))

  $effect(() => {
    if (open) {
      const t = setTimeout(() => input?.focus(), 0)
      return () => clearTimeout(t)
    }
    query = ''
    activeIndex = 0
  })

  $effect(() => {
    const p = parts(shortcut)
    const key = p[p.length - 1]
    const needs = { meta: p.includes('meta') || p.includes('cmd'), ctrl: p.includes('ctrl') || p.includes('control'), shift: p.includes('shift'), alt: p.includes('alt') }
    const isOpen = open
    const handler = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== key) return
      if (needs.meta && !e.metaKey) return
      if (needs.ctrl && !e.ctrlKey) return
      if (needs.shift && !e.shiftKey) return
      if (needs.alt && !e.altKey) return
      e.preventDefault()
      onOpenChange?.(!isOpen)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  })

  function selectAction(action: SpotlightAction) {
    addRecentAction(action.id)
    action.onClick()
    onOpenChange?.(false)
  }

  function handleKeyDown(e: KeyboardEvent) {
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); activeIndex = Math.min(activeIndex + 1, navigable.length - 1); break
      case 'ArrowUp': e.preventDefault(); activeIndex = Math.max(activeIndex - 1, 0); break
      case 'Home': e.preventDefault(); activeIndex = 0; break
      case 'End': e.preventDefault(); activeIndex = navigable.length - 1; break
      case 'Enter':
        e.preventDefault()
        if (activeIndex >= 0 && activeIndex < navigable.length) selectAction(navigable[activeIndex])
        break
      case 'Escape': e.preventDefault(); onOpenChange?.(false); break
    }
  }

  $effect(() => {
    if (!open || activeIndex < 0 || !list) return
    const item = list.querySelectorAll('[role="option"]')[activeIndex] as HTMLElement | undefined
    item?.scrollIntoView?.({ block: 'nearest' })
  })

  const actionId = (actionIdValue: string) => `${id}-action-${actionIdValue}`
  const activeDescendantId = $derived(activeIndex >= 0 && activeIndex < navigable.length ? actionId(navigable[activeIndex].id) : undefined)
  const shortcutKeys = $derived(parts(shortcut).map(p =>
    p === 'meta' || p === 'cmd' ? '⌘' : p === 'ctrl' || p === 'control' ? 'Ctrl' : p === 'shift' ? '⇧' : p === 'alt' ? '⌥' : p.toUpperCase(),
  ))
</script>

{#if open}
  <div class={cn('ui-spotlight', className)} {...rest}>
    <!-- React renders no tabindex here; focus lives on the input (focus trap). -->
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_interactive_supports_focus -->
    <div
      bind:this={overlay}
      class="ui-spotlight__overlay"
      data-motion={motionLevel()}
      onclick={(e) => { if (e.target === e.currentTarget) onOpenChange?.(false) }}
      onkeydown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label="Spotlight search"
    >
      <div class="ui-spotlight__dialog" data-motion={motionLevel()}>
        <div class="ui-spotlight__search">
          <span class="ui-spotlight__search-icon">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="5.5" stroke="currentColor" stroke-width="1.5" />
              <path d="M11 11L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
          </span>
          <input
            bind:this={input}
            class="ui-spotlight__input"
            type="text"
            role="combobox"
            aria-expanded={true}
            aria-haspopup="listbox"
            aria-controls={listboxId}
            aria-activedescendant={activeDescendantId}
            aria-autocomplete="list"
            {placeholder}
            value={query}
            oninput={(e) => { query = e.currentTarget.value; activeIndex = 0 }}
          />
          <span class="ui-spotlight__shortcut-badge">
            {#each shortcutKeys as key}<kbd class="ui-spotlight__kbd">{key}</kbd>{/each}
          </span>
        </div>
        <div bind:this={list} class="ui-spotlight__list" role="listbox" id={listboxId}>
          {#if navigable.length === 0 && query}
            <div class="ui-spotlight__empty">{nothingFoundMessage}</div>
          {:else}
            {#each entries as entry}
              {#if entry.type === 'section'}
                <div class="ui-spotlight__section-header" role="presentation">{entry.name}</div>
              {:else}
                {@const action = entry.action}
                {@const navIdx = navigable.indexOf(action)}
                {@const isActive = navIdx === activeIndex}
                <!-- Options are aria-activedescendant targets of the input, never focused. -->
                <!-- svelte-ignore a11y_click_events_have_key_events, a11y_interactive_supports_focus -->
                <div
                  role="option"
                  id={actionId(action.id)}
                  aria-selected={isActive}
                  class="ui-spotlight__action"
                  data-active={isActive ? '' : undefined}
                  onclick={() => selectAction(action)}
                  onmouseenter={() => { if (navIdx >= 0) activeIndex = navIdx }}
                >
                  {#if action.icon}<span class="ui-spotlight__action-icon"><Content value={action.icon} /></span>{/if}
                  <span class="ui-spotlight__action-content">
                    <span class="ui-spotlight__action-title">{action.title}</span>
                    {#if action.description}<span class="ui-spotlight__action-description">{action.description}</span>{/if}
                  </span>
                </div>
              {/if}
            {/each}
          {/if}
        </div>
        <div class="ui-spotlight__footer">
          <span><kbd>&uarr;</kbd><kbd>&darr;</kbd> navigate</span>
          <span><kbd>&crarr;</kbd> select</span>
          <span><kbd>esc</kbd> close</span>
        </div>
      </div>
    </div>
  </div>
{/if}
