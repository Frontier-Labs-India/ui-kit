<script module lang="ts">
  export interface TransferListItem {
    value: string
    label: string
    group?: string
  }
</script>

<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { SvelteSet } from 'svelte/reactivity'
  import { cn } from '../lib/cls.js'
  import { cssProps } from '../actions/css-props.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  type Pair = [TransferListItem[], TransferListItem[]]

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    /** Bindable [source, target]. */
    value: Pair
    onChange?: (value: Pair) => void
    titles?: [string, string]
    searchable?: boolean
    showTransferAll?: boolean
    listHeight?: number | string
    size?: 'sm' | 'md' | 'lg'
    motion?: MotionLevel
    class?: string
  }

  let {
    value = $bindable(), onChange, titles = ['Source', 'Target'], searchable = false, showTransferAll = true, listHeight,
    size = 'md', motion, class: className, ref = $bindable(null), ...rest
  }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)
  const uid = $props.id()
  const id = `transfer-list-${uid}`
  const leftSelected = new SvelteSet<string>()
  const rightSelected = new SvelteSet<string>()
  let leftSearch = $state('')
  let rightSearch = $state('')

  const filter = (items: TransferListItem[], q: string) => (q ? items.filter(i => i.label.toLowerCase().includes(q.toLowerCase())) : items)
  const leftFiltered = $derived(filter(value[0], leftSearch))
  const rightFiltered = $derived(filter(value[1], rightSearch))

  function commit(next: Pair) {
    value = next
    onChange?.(next)
  }
  const toggle = (set: SvelteSet<string>, v: string) => (set.has(v) ? set.delete(v) : set.add(v))

  // Only selected items visible in the current search move, as in React.
  function transfer(from: 0 | 1) {
    const selected = from === 0 ? leftSelected : rightSelected
    const visible = new Set((from === 0 ? leftFiltered : rightFiltered).map(i => i.value))
    const source = value[from]
    const toMove = source.filter(i => selected.has(i.value) && visible.has(i.value))
    if (toMove.length === 0) return
    const moving = new Set(toMove.map(i => i.value))
    const remaining = source.filter(i => !moving.has(i.value))
    commit(from === 0 ? [remaining, [...value[1], ...toMove]] : [[...value[0], ...toMove], remaining])
    for (const v of moving) selected.delete(v)
  }

  function transferAll(from: 0 | 1) {
    if (value[from].length === 0) return
    commit(from === 0 ? [[], [...value[1], ...value[0]]] : [[...value[0], ...value[1]], []])
    ;(from === 0 ? leftSelected : rightSelected).clear()
  }

  function groupsOf(items: TransferListItem[]) {
    if (!items.some(i => i.group)) return [{ name: '', items }]
    const map = new Map<string, TransferListItem[]>()
    for (const item of items) {
      const g = item.group ?? ''
      if (!map.has(g)) map.set(g, [])
      map.get(g)!.push(item)
    }
    return Array.from(map, ([name, list]) => ({ name, items: list }))
  }

  const maxBlock = $derived(listHeight !== undefined ? (typeof listHeight === 'number' ? `${listHeight}px` : listHeight) : '16rem')
</script>

{#snippet panel(items: TransferListItem[], filtered: TransferListItem[], title: string, selected: SvelteSet<string>, side: 'left' | 'right')}
  {@const selectedCount = items.filter(i => selected.has(i.value)).length}
  <div class="ui-transfer-list__panel" role="group" aria-label={title}>
    <div class="ui-transfer-list__header">
      <span class="ui-transfer-list__title">{title}</span>
      <span class="ui-transfer-list__count">{selectedCount > 0 ? `${selectedCount} / ` : ''}{items.length}</span>
    </div>
    {#if searchable}
      <div class="ui-transfer-list__search">
        <input
          type="text"
          class="ui-transfer-list__search-input"
          placeholder="Search..."
          value={side === 'left' ? leftSearch : rightSearch}
          oninput={e => { if (side === 'left') leftSearch = e.currentTarget.value; else rightSearch = e.currentTarget.value }}
          aria-label={`Search ${title}`}
        />
      </div>
    {/if}
    <div class="ui-transfer-list__items" role="listbox" aria-label={`${title} items`} aria-multiselectable="true" id={`${id}-${side}`} use:cssProps={{ 'max-block-size': maxBlock }}>
      {#each groupsOf(filtered) as group (group.name || '__default')}
        <div>
          {#if group.name}<div class="ui-transfer-list__group-header" role="presentation">{group.name}</div>{/if}
          {#each group.items as item (item.value)}
            {@const checked = selected.has(item.value)}
            <!-- React's options are pointer-only (no tabindex or key handling); kept for the contract. -->
            <!-- svelte-ignore a11y_click_events_have_key_events, a11y_interactive_supports_focus -->
            <div class="ui-transfer-list__item" role="option" aria-selected={checked} data-checked={checked || undefined} onclick={() => toggle(selected, item.value)}>
              <span class="ui-transfer-list__checkbox" data-checked={checked || undefined} aria-hidden="true"></span>
              <span class="ui-transfer-list__item-label">{item.label}</span>
            </div>
          {/each}
        </div>
      {/each}
    </div>
  </div>
{/snippet}

{#snippet chevron(d: string[])}<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">{#each d as path}<path d={path} stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />{/each}</svg>{/snippet}

<div class={cn('ui-transfer-list', className)} data-size={size} data-motion={motionLevel()} role="group" aria-label="Transfer list" bind:this={ref} {...rest}>
  {@render panel(value[0], leftFiltered, titles[0], leftSelected, 'left')}
  <div class="ui-transfer-list__controls">
    {#if showTransferAll}
      <button type="button" class="ui-transfer-list__control-btn" onclick={() => transferAll(0)} disabled={value[0].length === 0} aria-label="Transfer all to right" data-motion={motionLevel()}>{@render chevron(['M4 3L9 8L4 13', 'M8 3L13 8L8 13'])}</button>
    {/if}
    <button type="button" class="ui-transfer-list__control-btn" onclick={() => transfer(0)} disabled={leftSelected.size === 0} aria-label="Transfer selected to right" data-motion={motionLevel()}>{@render chevron(['M6 3L11 8L6 13'])}</button>
    <button type="button" class="ui-transfer-list__control-btn" onclick={() => transfer(1)} disabled={rightSelected.size === 0} aria-label="Transfer selected to left" data-motion={motionLevel()}>{@render chevron(['M10 3L5 8L10 13'])}</button>
    {#if showTransferAll}
      <button type="button" class="ui-transfer-list__control-btn" onclick={() => transferAll(1)} disabled={value[1].length === 0} aria-label="Transfer all to left" data-motion={motionLevel()}>{@render chevron(['M12 3L7 8L12 13', 'M8 3L3 8L8 13'])}</button>
    {/if}
  </div>
  {@render panel(value[1], rightFiltered, titles[1], rightSelected, 'right')}
</div>
