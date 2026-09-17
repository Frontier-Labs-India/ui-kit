<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import ErrorBoundary from '../lib/ErrorBoundary.svelte'
  import { cssProps } from '../actions/css-props.js'
  import { reactStyle } from '../lib/react-style.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  export interface SwitchPort {
    id: number
    label?: string
    status: 'up' | 'down' | 'admin-down' | 'unused'
    speed?: string
    type?: 'ethernet' | 'sfp' | 'qsfp' | 'management'
    vlan?: number
  }

  interface Props extends HTMLAttributes<HTMLDivElement> {
    ports: SwitchPort[]
    rows?: number
    label?: string
    showLabels?: boolean
    onPortClick?: (port: SwitchPort) => void
    size?: 'sm' | 'md' | 'lg'
    motion?: MotionLevel
    class?: string
  }

  let { ports, rows = 2, label, showLabels = false, onPortClick, size = 'md', motion, class: className, ...rest }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)
  let hovered = $state<number | null>(null)
  // Ports fill rows round-robin: 1,3,5… on the top row, 2,4,6… below.
  const portRows = $derived.by(() => {
    const out: SwitchPort[][] = Array.from({ length: rows }, () => [])
    ports.forEach((p, i) => out[i % rows].push(p))
    return out
  })
  const describe = (p: SwitchPort) => `Port ${p.id}${p.label ? ` (${p.label})` : ''}: ${p.status}${p.speed ? `, ${p.speed}` : ''}`
</script>

<ErrorBoundary>
  <div class={cn('ui-switch-faceplate', className)} data-motion={motionLevel()} data-size={size} role="group" aria-label={label ? `Switch: ${label}` : 'Network switch faceplate'} {...rest}>
    {#if label}<div class="ui-switch-faceplate__header">{label}</div>{/if}
    <div class="ui-switch-faceplate__grid">
      {#each portRows as row, r (r)}
        <div class="ui-switch-faceplate__row">
          {#each row as port (port.id)}
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div class="ui-switch-faceplate__port" data-status={port.status} data-type={port.type || 'ethernet'} onmouseenter={() => (hovered = port.id)} onmouseleave={() => (hovered = null)}>
              {#if port.status === 'up'}<span class="ui-switch-faceplate__led" aria-hidden="true"></span>{/if}
              {#if onPortClick}<button class="ui-switch-faceplate__port-btn" onclick={() => onPortClick(port)} aria-label={describe(port)}>{port.id}</button>{:else}{port.id}{/if}
              {#if hovered === port.id}
                <div class="ui-switch-faceplate__tooltip">
                  <div>Port {port.id}{port.label ? ` — ${port.label}` : ''}</div>
                  <div>{port.status}{port.vlan != null ? ` | VLAN ${port.vlan}` : ''}</div>
                  {#if port.speed}<div class="ui-switch-faceplate__tooltip-speed">{port.speed} {port.type || 'ethernet'}</div>{/if}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/each}
    </div>
    {#if showLabels}
      <div class="ui-switch-faceplate__row" use:cssProps={reactStyle({ marginBlockStart: '0.125rem' })}>
        {#each ports.slice(0, Math.ceil(ports.length / rows)) as port (port.id)}
          {#if port.label}<div class="ui-switch-faceplate__port-label">{port.label}</div>{/if}
        {/each}
      </div>
    {/if}
  </div>
</ErrorBoundary>
