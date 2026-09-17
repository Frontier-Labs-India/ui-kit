<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { SvelteSet } from 'svelte/reactivity'
  import { cn } from '../lib/cls.js'
  import Content from '../lib/Content.svelte'
  import ErrorBoundary from '../lib/ErrorBoundary.svelte'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  export interface TimelineEvent {
    id: string
    timestamp: number | Date
    severity: 'info' | 'warning' | 'critical' | 'ok'
    title: string | Snippet
    description?: string | Snippet
  }

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    events: TimelineEvent[]
    orientation?: 'vertical' | 'horizontal'
    expandable?: boolean
    maxVisible?: number
    motion?: MotionLevel
    class?: string
  }

  let { events, orientation = 'vertical', expandable = false, maxVisible, motion, class: className, ref = $bindable(null), ...rest }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)
  const expanded = new SvelteSet<string>()
  const visible = $derived(maxVisible !== undefined ? events.slice(0, maxVisible) : events)
  const more = $derived(maxVisible !== undefined && events.length > maxVisible ? events.length - maxVisible : 0)
  // Locale-default time, as React: toLocaleTimeString(undefined, …).
  const time = (t: number | Date) => (t instanceof Date ? t : new Date(t)).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  const toggle = (id: string) => (expanded.has(id) ? expanded.delete(id) : expanded.add(id))
</script>

<ErrorBoundary>
  <div class={cn('ui-severity-timeline', className)} data-orientation={orientation} data-motion={motionLevel()} bind:this={ref} {...rest}>
    <ol class="ui-severity-timeline__list">
      {#each visible as event (event.id)}
        <li class="ui-severity-timeline__item">
          <div class="ui-severity-timeline__dot" data-severity={event.severity}></div>
          <div class="ui-severity-timeline__connector"></div>
          <div class="ui-severity-timeline__content">
            <div class="ui-severity-timeline__title"><Content value={event.title} /></div>
            <div class="ui-severity-timeline__time">{time(event.timestamp)}</div>
            {#if event.description && expandable}
              <button class="ui-severity-timeline__expand-btn" onclick={() => toggle(event.id)} aria-expanded={expanded.has(event.id)}>{expanded.has(event.id) ? 'Hide details' : 'Show details'}</button>
              <div class="ui-severity-timeline__description" data-expanded={expanded.has(event.id) ? 'true' : 'false'}><Content value={event.description} /></div>
            {:else if event.description}
              <div class="ui-severity-timeline__description"><Content value={event.description} /></div>
            {/if}
          </div>
        </li>
      {/each}
    </ol>
    {#if more > 0}<div class="ui-severity-timeline__more">+{more} more events</div>{/if}
  </div>
</ErrorBoundary>
