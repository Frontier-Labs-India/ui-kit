<script module lang="ts">
  import type { Snippet } from 'svelte'

  export interface SortableItem {
    id: string
    content: string | Snippet
  }
</script>

<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'
  import Content from '../lib/Content.svelte'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> {
    items: SortableItem[]
    onChange: (items: SortableItem[]) => void
    handle?: boolean
    disabled?: boolean
    orientation?: 'vertical' | 'horizontal'
    motion?: MotionLevel
    class?: string
  }

  let { items, onChange, handle = true, disabled = false, orientation = 'vertical', motion, class: className, 'aria-label': ariaLabel, ...rest }: Props = $props()

  const cls = makeCls('sortable-list')
  const motionLevel = getMotionLevel(() => motion)
  let list = $state<HTMLDivElement | null>(null)
  let grabbedId = $state<string | null>(null)
  let draggedId = $state<string | null>(null)
  let dropIndex = $state<number | null>(null)

  const options = () => (list ? Array.from(list.querySelectorAll<HTMLElement>('[role="option"]')) : [])

  // The first option is the tab stop whenever the items change (roving tabindex).
  $effect(() => {
    void items
    if (!list) return
    options().forEach((opt, i) => opt.setAttribute('tabindex', i === 0 ? '0' : '-1'))
  })

  function focusItem(index: number) {
    const opts = options()
    opts.forEach((opt, i) => opt.setAttribute('tabindex', i === index ? '0' : '-1'))
    opts[index]?.focus()
  }

  function moveItem(from: number, to: number) {
    if (to < 0 || to >= items.length || from === to) return
    const next = [...items]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    onChange(next)
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (disabled || !list) return
    const opts = options()
    const focused = document.activeElement as HTMLElement
    const index = opts.indexOf(focused)
    if (index < 0) return
    const prevKey = orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft'
    const nextKey = orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight'
    if (e.altKey && e.key === prevKey) {
      e.preventDefault()
      if (index > 0) {
        moveItem(index, index - 1)
        requestAnimationFrame(() => focusItem(index - 1))
      }
      return
    }
    if (e.altKey && e.key === nextKey) {
      e.preventDefault()
      if (index < items.length - 1) {
        moveItem(index, index + 1)
        requestAnimationFrame(() => focusItem(index + 1))
      }
      return
    }
    switch (e.key) {
      case prevKey: e.preventDefault(); if (index > 0) focusItem(index - 1); break
      case nextKey: e.preventDefault(); if (index < opts.length - 1) focusItem(index + 1); break
      case ' ':
      case 'Enter': {
        e.preventDefault()
        const id = focused.getAttribute('data-item-id')
        grabbedId = grabbedId === id ? null : id
        break
      }
      case 'Escape': e.preventDefault(); grabbedId = null; break
      case 'Home': e.preventDefault(); focusItem(0); break
      case 'End': e.preventDefault(); focusItem(opts.length - 1); break
    }
  }

  function dropIndexFrom(e: DragEvent) {
    const opts = options()
    for (let i = 0; i < opts.length; i++) {
      const rect = opts[i].getBoundingClientRect()
      const mid = orientation === 'vertical' ? rect.top + rect.height / 2 : rect.left + rect.width / 2
      if ((orientation === 'vertical' ? e.clientY : e.clientX) < mid) return i
    }
    return items.length
  }

  function handleDragStart(e: DragEvent, id: string) {
    if (disabled) return
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', id)
    }
    draggedId = id
    const target = e.currentTarget as HTMLElement
    requestAnimationFrame(() => target?.classList?.add('ui-sortable-list__item--dragging'))
  }

  function handleDragEnd(e: DragEvent) {
    ;(e.currentTarget as HTMLElement).classList.remove('ui-sortable-list__item--dragging')
    draggedId = null
    dropIndex = null
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    const id = e.dataTransfer?.getData('text/plain') ?? ''
    const from = items.findIndex(item => item.id === id)
    let to = dropIndexFrom(e)
    draggedId = null
    dropIndex = null
    if (from < 0) return
    // Dragging downward: removing the item shifts the target up by one.
    if (from < to) to -= 1
    if (from !== to) {
      const next = [...items]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      onChange(next)
    }
  }
</script>

<div class={cn(cls('root'), className)} data-motion={motionLevel()} data-orientation={orientation} {...rest}>
  <!-- React sets no tabindex on the listbox: focus lives on the options (roving tabindex). -->
  <!-- svelte-ignore a11y_interactive_supports_focus -->
  <div
    bind:this={list}
    role="listbox"
    aria-label={ariaLabel || 'Sortable list'}
    aria-orientation={orientation}
    onkeydown={handleKeyDown}
    ondragover={!disabled ? (e => { e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'; dropIndex = dropIndexFrom(e) }) : undefined}
    ondragleave={!disabled ? (e => { if (list && !list.contains(e.relatedTarget as Node)) dropIndex = null }) : undefined}
    ondrop={!disabled ? handleDrop : undefined}
  >
    {#each items as item, i (item.id)}
      {#if dropIndex === i && draggedId !== null}<div class="ui-sortable-list__drop-indicator" aria-hidden="true"></div>{/if}
      <div
        role="option"
        aria-selected={grabbedId === item.id}
        aria-disabled={disabled || undefined}
        aria-roledescription="sortable item"
        data-item-id={item.id}
        data-grabbed={grabbedId === item.id ? 'true' : undefined}
        class="ui-sortable-list__item"
        tabindex={-1}
        draggable={!disabled}
        ondragstart={!disabled ? (e => handleDragStart(e, item.id)) : undefined}
        ondragend={!disabled ? handleDragEnd : undefined}
      >
        {#if handle}
          <span class="ui-sortable-list__handle" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="5.5" cy="3" r="1" fill="currentColor" /><circle cx="10.5" cy="3" r="1" fill="currentColor" />
              <circle cx="5.5" cy="8" r="1" fill="currentColor" /><circle cx="10.5" cy="8" r="1" fill="currentColor" />
              <circle cx="5.5" cy="13" r="1" fill="currentColor" /><circle cx="10.5" cy="13" r="1" fill="currentColor" />
            </svg>
          </span>
        {/if}
        <span class="ui-sortable-list__content"><Content value={item.content} /></span>
      </div>
    {/each}
    {#if dropIndex === items.length && draggedId !== null}<div class="ui-sortable-list__drop-indicator" aria-hidden="true"></div>{/if}
  </div>
</div>
