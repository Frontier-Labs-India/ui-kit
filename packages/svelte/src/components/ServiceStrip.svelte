<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import Content from '../lib/Content.svelte'
  import ErrorBoundary from '../lib/ErrorBoundary.svelte'
  import { useEntrance } from '../runes/entrance.svelte.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  export interface ServiceItem {
    name: string
    status: 'running' | 'stopped' | 'error' | 'unknown'
    version?: string
    icon?: string | Snippet
  }

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    services: ServiceItem[]
    maxVisible?: number
    size?: 'sm' | 'md'
    onServiceClick?: (service: ServiceItem) => void
    motion?: MotionLevel
    class?: string
  }

  let { services, maxVisible, size = 'md', onServiceClick, motion, class: className, ref = $bindable(null), ...rest }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)
  const el = $derived(ref)
  useEntrance(() => el, () => (motionLevel() >= 2 ? 'fade-up' : 'none'), () => ({ duration: 280 }))

  const cut = $derived(maxVisible != null && maxVisible < services.length)
  const visible = $derived(cut ? services.slice(0, maxVisible) : services)
  const overflow = $derived(cut ? services.length - maxVisible! : 0)

  function key(e: KeyboardEvent, s: ServiceItem) {
    if (onServiceClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      onServiceClick(s)
    }
  }
</script>

<ErrorBoundary>
  <!-- React returns null for an empty list; so does this. -->
  {#if services.length > 0}
    <div bind:this={ref} class={cn('ui-service-strip', className)} data-motion={motionLevel()} data-size={size} role="list" aria-label="Services" {...rest}>
      {#each visible as service (service.name)}
        <!-- tabindex is set only with a click handler, as in React. -->
        <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
        <span
          class="ui-service-strip__badge"
          data-status={service.status}
          data-clickable={onServiceClick ? '' : undefined}
          role="listitem"
          aria-label={`${service.name}: ${service.status}${service.version ? ` v${service.version}` : ''}`}
          onclick={onServiceClick ? () => onServiceClick(service) : undefined}
          onkeydown={onServiceClick ? e => key(e, service) : undefined}
          tabindex={onServiceClick ? 0 : undefined}
        >
          <span class="ui-service-strip__dot" aria-hidden="true"></span>
          {#if service.icon}<span class="ui-service-strip__icon" aria-hidden="true"><Content value={service.icon} /></span>{/if}
          <span class="ui-service-strip__name">{service.name}</span>
          {#if service.version}<span class="ui-service-strip__version">v{service.version}</span>{/if}
        </span>
      {/each}
      {#if overflow > 0}<span class="ui-service-strip__overflow" role="listitem" aria-label={`${overflow} more services`}>+{overflow} more</span>{/if}
    </div>
  {/if}
</ErrorBoundary>
