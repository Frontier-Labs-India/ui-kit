<script module lang="ts">
  export interface TocItem {
    id: string
    label: string
    level: number
    children?: TocItem[]
  }
</script>

<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'
  import { cssProps } from '../actions/css-props.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends HTMLAttributes<HTMLElement> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLElement | null
    items: TocItem[]
    /** Controlled active item; omit to track clicks (and scroll spy) internally. */
    activeId?: string
    onItemClick?: (id: string) => void
    scrollSpy?: boolean
    scrollOffset?: number
    size?: 'sm' | 'md' | 'lg'
    variant?: 'default' | 'filled' | 'dots'
    motion?: MotionLevel
    class?: string
  }

  let {
    items, activeId: controlledActiveId, onItemClick, scrollSpy = false, scrollOffset = 0, size = 'md', variant = 'default',
    motion, class: className, ref = $bindable(null), ...rest
  }: Props = $props()

  const flatten = (list: TocItem[]): TocItem[] => list.flatMap(i => [i, ...(i.children ? flatten(i.children) : [])])

  const cls = makeCls('toc')
  const motionLevel = getMotionLevel(() => motion)
  let internal = $state('')
  const controlled = $derived(controlledActiveId !== undefined)
  const activeId = $derived(controlled ? controlledActiveId! : internal)
  let list = $state<HTMLUListElement | null>(null)
  let indicator = $state<HTMLDivElement | null>(null)

  // Slide the default variant's indicator to the active link (style properties, CSP-safe).
  $effect(() => {
    if (variant !== 'default') return
    const id = activeId
    if (!list || !indicator || !id) {
      if (indicator) indicator.style.opacity = '0'
      return
    }
    const link = list.querySelector<HTMLElement>(`[data-id="${id}"]`)
    if (!link) {
      indicator.style.opacity = '0'
      return
    }
    const listRect = list.getBoundingClientRect()
    const linkRect = link.getBoundingClientRect()
    indicator.style.transform = `translateY(${linkRect.top - listRect.top}px)`
    indicator.style.blockSize = `${linkRect.height}px`
    indicator.style.opacity = '1'
  })

  // Scroll spy: the topmost intersecting section becomes active (uncontrolled only).
  $effect(() => {
    if (!scrollSpy) return
    const isControlled = controlled
    const elements = flatten(items).map(i => document.getElementById(i.id)).filter((el): el is HTMLElement => el !== null)
    if (elements.length === 0) return
    const observer = new IntersectionObserver(entries => {
      let topId: string | null = null
      let top = Infinity
      for (const entry of entries) {
        if (entry.isIntersecting && entry.boundingClientRect.top < top) {
          top = entry.boundingClientRect.top
          topId = entry.target.id
        }
      }
      if (topId && !isControlled) internal = topId
    }, { rootMargin: `${-scrollOffset}px 0px 0px 0px`, threshold: [0, 0.5, 1] })
    elements.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  })

  function handleClick(id: string) {
    if (!controlled) internal = id
    onItemClick?.(id)
    document.getElementById(id)?.scrollIntoView({ behavior: motionLevel() > 0 ? 'smooth' : 'auto' })
  }
</script>

{#snippet links(list: TocItem[])}
  {#each list as item (item.id)}
    <li class="ui-toc__item">
      <button type="button" class="ui-toc__link" data-id={item.id} data-level={item.level} data-active={item.id === activeId || undefined} onclick={() => handleClick(item.id)}>{item.label}</button>
      {#if item.children && item.children.length > 0}<ul class="ui-toc__list" role="list">{@render links(item.children)}</ul>{/if}
    </li>
  {/each}
{/snippet}

<nav aria-label="Table of contents" class={cn(cls('root'), className)} data-size={size} data-variant={variant} data-motion={motionLevel()} bind:this={ref} {...rest}>
  <div use:cssProps={{ position: 'relative' }}>
    {#if variant === 'default'}<div bind:this={indicator} class="ui-toc__indicator" aria-hidden="true" use:cssProps={{ opacity: '0' }}></div>{/if}
    <ul bind:this={list} class="ui-toc__list" role="list">{@render links(items)}</ul>
  </div>
</nav>
