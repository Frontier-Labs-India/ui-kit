<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import ErrorBoundary from '../lib/ErrorBoundary.svelte'
  import { cssProps } from '../actions/css-props.js'
  import { reactStyle } from '../lib/react-style.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  export interface PortStatus {
    port: number
    status: 'ok' | 'warning' | 'critical' | 'unknown'
    label?: string
  }

  interface Props extends HTMLAttributes<HTMLDivElement> {
    ports: PortStatus[]
    columns?: number
    size?: 'sm' | 'md'
    onPortClick?: (port: number) => void
    motion?: MotionLevel
    class?: string
  }

  let { ports, columns = 8, size = 'md', onPortClick, motion, class: className, ...rest }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)
  let hovered = $state<number | null>(null)
</script>

<ErrorBoundary>
  <div class={cn('ui-port-status-grid', className)} data-motion={motionLevel()} data-size={size} role="group" aria-label="Port status" {...rest}>
    <div class="ui-port-status-grid__grid" use:cssProps={reactStyle({ '--columns': columns })}>
      {#each ports as p (p.port)}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="ui-port-status-grid__item" data-status={p.status} onmouseenter={() => (hovered = p.port)} onmouseleave={() => (hovered = null)}>
          {#if onPortClick}
            <button class="ui-port-status-grid__item-btn" onclick={() => onPortClick(p.port)} aria-label={`Port ${p.port}${p.label ? ` (${p.label})` : ''}: ${p.status}`}>{p.port}</button>
          {:else}{p.port}{/if}
          {#if hovered === p.port && p.label}<div class="ui-port-status-grid__tooltip">{p.label} ({p.status})</div>{/if}
        </div>
      {/each}
    </div>
  </div>
</ErrorBoundary>
