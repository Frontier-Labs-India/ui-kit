<script module lang="ts">
  import type { Snippet } from 'svelte'

  export interface KanbanCard {
    id: string
    title: string | Snippet
    description?: string | Snippet
    tags?: string[]
    assignee?: string | Snippet
    priority?: 'low' | 'medium' | 'high' | 'critical'
  }
</script>

<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import Content from '../lib/Content.svelte'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
    title: string | Snippet
    cards: KanbanCard[]
    onCardMove?: (cardId: string, targetColumnId: string, targetIndex: number) => void
    onCardClick?: (cardId: string) => void
    wipLimit?: number
    collapsed?: boolean
    onCollapse?: (collapsed: boolean) => void
    columnId: string
    motion?: MotionLevel
    class?: string
  }

  let { title, cards, onCardMove, onCardClick, wipLimit, collapsed = false, onCollapse, columnId, motion, class: className, ...rest }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)
  const uid = $props.id()
  const headerId = `kanban-header-${uid}`
  const wipExceeded = $derived(wipLimit !== undefined && cards.length >= wipLimit)
  let cardsEl = $state<HTMLDivElement | null>(null)
  let dropIndex = $state<number | null>(null)
  let dragOver = $state(false)
  let enterCount = 0

  function indexAt(clientY: number) {
    if (!cardsEl) return cards.length
    const els = Array.from(cardsEl.querySelectorAll<HTMLElement>('[data-card]'))
    for (let i = 0; i < els.length; i++) {
      const rect = els[i].getBoundingClientRect()
      if (clientY < rect.top + rect.height / 2) return i
    }
    return cards.length
  }

  function handleDragStart(e: DragEvent, cardId: string) {
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', JSON.stringify({ cardId, sourceColumnId: columnId }))
    }
    const target = e.currentTarget as HTMLElement
    requestAnimationFrame(() => target?.classList?.add('ui-kanban-column__card--dragging'))
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    enterCount = 0
    dropIndex = null
    dragOver = false
    try {
      const data = JSON.parse(e.dataTransfer?.getData('text/plain') ?? '')
      onCardMove?.(data.cardId, columnId, indexAt(e.clientY))
    } catch {
      // Ignore drags that did not come from a card.
    }
  }

  // Touch drag: track the finger over the cards, move on release.
  $effect(() => {
    const container = cardsEl
    const move = onCardMove
    const column = columnId
    if (!container || !move) return
    let touch: { cardId: string; el: HTMLElement } | null = null
    const onStart = (e: TouchEvent) => {
      const card = (e.target as HTMLElement).closest<HTMLElement>('[data-card]')
      const cardId = card?.getAttribute('data-card-id')
      if (!card || !cardId) return
      card.classList.add('ui-kanban-column__card--dragging')
      touch = { cardId, el: card }
    }
    const onMove = (e: TouchEvent) => {
      if (!touch) return
      e.preventDefault()
      dropIndex = indexAt(e.touches[0].clientY)
    }
    const onEnd = () => {
      if (!touch) return
      touch.el.classList.remove('ui-kanban-column__card--dragging')
      if (dropIndex !== null) move(touch.cardId, column, dropIndex)
      dropIndex = null
      touch = null
    }
    container.addEventListener('touchstart', onStart, { passive: true })
    container.addEventListener('touchmove', onMove, { passive: false })
    container.addEventListener('touchend', onEnd)
    return () => {
      container.removeEventListener('touchstart', onStart)
      container.removeEventListener('touchmove', onMove)
      container.removeEventListener('touchend', onEnd)
    }
  })
</script>

<div
  class={cn('ui-kanban-column', className)}
  data-motion={motionLevel()}
  data-column-id={columnId}
  data-collapsed={collapsed ? '' : undefined}
  data-wip-exceeded={wipExceeded ? '' : undefined}
  role="region"
  aria-labelledby={headerId}
  {...rest}
>
  <div class="ui-kanban-column__header">
    <span class="ui-kanban-column__title" id={headerId}><Content value={title} /></span>
    <span class="ui-kanban-column__count">{cards.length}</span>
    {#if wipLimit !== undefined}<span class="ui-kanban-column__wip-label" aria-label={`WIP limit: ${wipLimit}`}>/ {wipLimit}</span>{/if}
    {#if onCollapse}
      <!-- React renders this button without a type. -->
      <button class="ui-kanban-column__collapse-btn" onclick={() => onCollapse?.(!collapsed)} aria-label={collapsed ? 'Expand column' : 'Collapse column'}>
        {#if collapsed}
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M5 3L9 7L5 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
        {:else}
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M9 3L5 7L9 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
        {/if}
      </button>
    {/if}
  </div>
  {#if !collapsed}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      bind:this={cardsEl}
      class="ui-kanban-column__cards"
      data-drag-over={dragOver ? '' : undefined}
      ondragenter={onCardMove ? (e => { e.preventDefault(); enterCount++; dragOver = true }) : undefined}
      ondragover={onCardMove ? (e => { e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'; dropIndex = indexAt(e.clientY) }) : undefined}
      ondragleave={onCardMove ? (() => { enterCount--; if (enterCount <= 0) { enterCount = 0; dropIndex = null; dragOver = false } }) : undefined}
      ondrop={onCardMove ? handleDrop : undefined}
    >
      {#each cards as card, i (card.id)}
        {#if dropIndex === i}<div class="ui-kanban__drop-indicator" aria-hidden="true"></div>{/if}
        {@const footer = card.tags?.length || card.assignee}
        <!-- React's card is a focusable div with no role when clickable (inherited); kept for the contract. -->
        <!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events, a11y_no_noninteractive_tabindex -->
        <div
          class="ui-kanban-column__card"
          data-card=""
          data-card-id={card.id}
          data-priority={card.priority || undefined}
          tabindex={onCardClick ? 0 : undefined}
          draggable={onCardMove ? true : undefined}
          ondragstart={onCardMove ? (e => handleDragStart(e, card.id)) : undefined}
          ondragend={onCardMove ? (e => { (e.currentTarget as HTMLElement).classList.remove('ui-kanban-column__card--dragging'); dropIndex = null; dragOver = false }) : undefined}
          onclick={() => onCardClick?.(card.id)}
          onkeydown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onCardClick?.(card.id) } }}
        >
          <span class="ui-kanban-column__card-title"><Content value={card.title} /></span>
          {#if card.description}<span class="ui-kanban-column__card-desc"><Content value={card.description} /></span>{/if}
          {#if footer}
            <div class="ui-kanban-column__card-footer">
              {#each card.tags ?? [] as tag (tag)}<span class="ui-kanban-column__tag">{tag}</span>{/each}
              {#if card.assignee}<span class="ui-kanban-column__assignee"><Content value={card.assignee} /></span>{/if}
            </div>
          {/if}
        </div>
      {/each}
      {#if dropIndex === cards.length}<div class="ui-kanban__drop-indicator" aria-hidden="true"></div>{/if}
    </div>
  {/if}
</div>
