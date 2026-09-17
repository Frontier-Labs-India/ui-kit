<script module lang="ts">
  import type { Snippet } from 'svelte'

  export interface CommandItem {
    id: string
    label: string
    description?: string
    icon?: string | Snippet
    shortcut?: string[]
    section?: string
    onSelect: () => void
    disabled?: boolean
    keywords?: string[]
  }

  /* Module scope, shared by every CommandBar, as in React. State, so the
   * Recent section is current when the bar reopens. */
  const recentIds = $state<string[]>([])
  const MAX_RECENT = 5
  function addRecent(id: string) {
    const idx = recentIds.indexOf(id)
    if (idx >= 0) recentIds.splice(idx, 1)
    recentIds.unshift(id)
    if (recentIds.length > MAX_RECENT) recentIds.pop()
  }
</script>

<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import Content from '../lib/Content.svelte'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    items: CommandItem[]
    open: boolean
    onOpenChange: (open: boolean) => void
    placeholder?: string
    emptyMessage?: string
    /** Keys that toggle the bar, e.g. ['ctrl', 'shift', 'p']; default Meta+K or Ctrl+K. */
    shortcut?: string[]
    motion?: MotionLevel
    class?: string
  }

  let {
    items, open, onOpenChange, placeholder = 'Type a command...', emptyMessage = 'No results found', shortcut, motion,
    class: className, ...rest
  }: Props = $props()

  function fuzzyMatch(query: string, target: string) {
    const q = query.toLowerCase()
    const t = target.toLowerCase()
    let qi = 0
    for (let ti = 0; ti < t.length && qi < q.length; ti++) if (t[ti] === q[qi]) qi++
    return qi === q.length
  }
  const matches = (item: CommandItem, q: string) =>
    !q || fuzzyMatch(q, item.label) || (!!item.description && fuzzyMatch(q, item.description)) || !!item.keywords?.some(k => fuzzyMatch(q, k))

  const motionLevel = getMotionLevel(() => motion)
  const uid = $props.id()
  const id = `command-bar-${uid}`
  const listboxId = `${id}-listbox`
  let dialog: HTMLDialogElement | undefined
  let input = $state<HTMLInputElement | null>(null)
  let list = $state<HTMLDivElement | null>(null)
  let query = $state('')
  let activeIndex = $state(0)

  const filtered = $derived(items.filter(i => matches(i, query)))
  type Entry = { type: 'section'; name: string } | { type: 'item'; item: CommandItem }
  const entries = $derived.by(() => {
    const out: Entry[] = []
    if (!query && recentIds.length > 0) {
      const recent = recentIds.map(rid => items.find(i => i.id === rid)).filter(Boolean) as CommandItem[]
      if (recent.length > 0) {
        out.push({ type: 'section', name: 'Recent' })
        for (const item of recent) out.push({ type: 'item', item })
      }
    }
    if (filtered.some(i => i.section)) {
      const seen = new Set<string>()
      for (const item of filtered) {
        const section = item.section ?? ''
        if (section && !seen.has(section)) {
          seen.add(section)
          out.push({ type: 'section', name: section })
        }
        out.push({ type: 'item', item })
      }
    } else {
      for (const item of filtered) out.push({ type: 'item', item })
    }
    return out
  })
  const navigable = $derived(entries.flatMap(e => (e.type === 'item' && !e.item.disabled ? [e.item] : [])))

  // The open prop drives the modal; opening focuses the input, closing resets.
  $effect(() => {
    if (!dialog) return
    if (open) {
      if (!dialog.hasAttribute('open')) dialog.showModal()
      const t = setTimeout(() => input?.focus(), 0)
      return () => clearTimeout(t)
    }
    if (dialog.hasAttribute('open')) dialog.close()
    query = ''
    activeIndex = 0
  })

  $effect(() => {
    const isOpen = open
    const keys = shortcut
    const change = onOpenChange
    const handler = (e: KeyboardEvent) => {
      const hit = keys
        ? keys.every(key => {
            const k = key.toLowerCase()
            if (k === 'meta' || k === 'cmd') return e.metaKey
            if (k === 'ctrl' || k === 'control') return e.ctrlKey
            if (k === 'shift') return e.shiftKey
            if (k === 'alt') return e.altKey
            return e.key.toLowerCase() === k || e.key === key
          })
        : (e.metaKey || e.ctrlKey) && e.key === 'k'
      if (hit) {
        e.preventDefault()
        change(!isOpen)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  })

  function select(item: CommandItem) {
    if (item.disabled) return
    addRecent(item.id)
    item.onSelect()
    onOpenChange(false)
  }

  function handleKeyDown(e: KeyboardEvent) {
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); activeIndex = Math.min(activeIndex + 1, navigable.length - 1); break
      case 'ArrowUp': e.preventDefault(); activeIndex = Math.max(activeIndex - 1, 0); break
      case 'Home': e.preventDefault(); activeIndex = 0; break
      case 'End': e.preventDefault(); activeIndex = navigable.length - 1; break
      case 'Enter':
        e.preventDefault()
        if (activeIndex >= 0 && activeIndex < navigable.length) select(navigable[activeIndex])
        break
      case 'Escape': e.preventDefault(); onOpenChange(false); break
    }
  }

  $effect(() => {
    if (!open || activeIndex < 0 || !list) return
    const item = list.querySelectorAll('[role="option"]:not([aria-disabled="true"])')[activeIndex] as HTMLElement | undefined
    item?.scrollIntoView?.({ block: 'nearest' })
  })

  const itemId = (v: string) => `${id}-item-${v}`
  const activeDescendantId = $derived(activeIndex >= 0 && activeIndex < navigable.length ? itemId(navigable[activeIndex].id) : undefined)
</script>

<div class={cn('ui-command-bar', className)} {...rest}>
  <!-- One dialog node open or closed, as React keeps it: the closed bar renders it bare. -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <dialog
    bind:this={dialog}
    data-motion={motionLevel()}
    aria-label={open ? 'Command palette' : undefined}
    onclick={open ? (e => { if (e.target === e.currentTarget) onOpenChange(false) }) : undefined}
    onkeydown={open ? handleKeyDown : undefined}
  >
    {#if open}
      <div class="ui-command-bar__search">
        <span class="ui-command-bar__search-icon">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="5.5" stroke="currentColor" stroke-width="1.5" />
            <path d="M11 11L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
        </span>
        <input
          bind:this={input}
          class="ui-command-bar__input"
          type="text"
          role="combobox"
          aria-expanded={true}
          aria-haspopup="listbox"
          aria-controls={listboxId}
          aria-activedescendant={activeDescendantId}
          aria-autocomplete="list"
          {placeholder}
          value={query}
          oninput={e => { query = e.currentTarget.value; activeIndex = 0 }}
        />
      </div>
      <div bind:this={list} class="ui-command-bar__list" role="listbox" id={listboxId}>
        {#if entries.length === 0 || (filtered.length === 0 && query)}
          <div class="ui-command-bar__empty">{emptyMessage}</div>
        {:else}
          {#each entries as entry}
            {#if entry.type === 'section'}
              <div class="ui-command-bar__section"><div class="ui-command-bar__section-header" role="presentation">{entry.name}</div></div>
            {:else}
              {@const item = entry.item}
              {@const navIdx = navigable.indexOf(item)}
              {@const isActive = navIdx === activeIndex}
              <!-- Options are aria-activedescendant targets of the input, never focused. -->
              <!-- svelte-ignore a11y_click_events_have_key_events, a11y_interactive_supports_focus -->
              <div
                role="option"
                id={itemId(item.id)}
                aria-selected={isActive}
                aria-disabled={item.disabled || undefined}
                class="ui-command-bar__item"
                data-active={isActive ? '' : undefined}
                onclick={() => select(item)}
                onmouseenter={() => { if (!item.disabled && navIdx >= 0) activeIndex = navIdx }}
              >
                {#if item.icon}<span class="ui-command-bar__item-icon"><Content value={item.icon} /></span>{/if}
                <span class="ui-command-bar__item-content">
                  <span class="ui-command-bar__item-label">{item.label}</span>
                  {#if item.description}<span class="ui-command-bar__item-description">{item.description}</span>{/if}
                </span>
                {#if item.shortcut}<span class="ui-command-bar__shortcut">{#each item.shortcut as key}<kbd class="ui-command-bar__kbd">{key}</kbd>{/each}</span>{/if}
              </div>
            {/if}
          {/each}
        {/if}
      </div>
    {/if}
  </dialog>
</div>
