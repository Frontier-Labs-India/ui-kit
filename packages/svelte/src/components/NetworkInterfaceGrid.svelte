<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import ErrorBoundary from '../lib/ErrorBoundary.svelte'
  import { cssProps } from '../actions/css-props.js'
  import { mergeStyles, type StyleInput } from '../lib/react-style.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  export interface NetworkInterface {
    name: string
    status: 'up' | 'down' | 'dormant' | 'unknown'
    speed?: string
    duplex?: 'full' | 'half' | 'unknown'
    mac?: string
    ipv4?: string
    ipv6?: string
    mtu?: number
    txRate?: number
    rxRate?: number
    txErrors?: number
    rxErrors?: number
    type?: 'ethernet' | 'bond' | 'bridge' | 'vlan' | 'loopback' | 'wireless'
  }

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'style'> {
    interfaces: NetworkInterface[]
    columns?: number
    size?: 'sm' | 'md' | 'lg'
    showTraffic?: boolean
    showErrors?: boolean
    onInterfaceClick?: (iface: NetworkInterface) => void
    compact?: boolean
    motion?: MotionLevel
    style?: StyleInput
    class?: string
  }

  const TYPE_LABELS: Record<string, string> = { ethernet: 'ETH', bond: 'BOND', bridge: 'BR', vlan: 'VLAN', loopback: 'LO', wireless: 'WLAN' }
  function rate(b: number): string {
    if (b >= 1_073_741_824) return `${(b / 1_073_741_824).toFixed(1)} GB/s`
    if (b >= 1_048_576) return `${(b / 1_048_576).toFixed(1)} MB/s`
    if (b >= 1024) return `${(b / 1024).toFixed(1)} KB/s`
    return `${b} B/s`
  }
  const errClass = (n: number) => `ui-nig__error-item${n === 0 ? ' ui-nig__error-item--zero' : ''}`

  let {
    interfaces, columns, size = 'md', showTraffic = false, showErrors = false, onInterfaceClick, compact = false, motion,
    class: className, style, ...rest
  }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)
  const styles = $derived(mergeStyles(columns != null ? { '--nig-cols': String(columns) } : null, style))
  const label = (i: NetworkInterface) => `${i.name}: ${i.status}${i.speed ? `, ${i.speed}` : ''}${i.type ? `, ${i.type}` : ''}`
</script>

{#snippet card(iface: NetworkInterface)}
  <div class="ui-nig__header">
    <span class="ui-nig__led" data-status={iface.status} aria-hidden="true"></span>
    <span class="ui-nig__name">{iface.name}</span>
    {#if iface.type}<span class="ui-nig__type-badge">{TYPE_LABELS[iface.type] || iface.type}</span>{/if}
  </div>
  {#if (iface.speed || iface.duplex) && !compact}
    <div class="ui-nig__details">
      {#if iface.speed}<span class="ui-nig__speed-badge">{iface.speed}</span>{/if}
      {#if iface.duplex}<span class="ui-nig__duplex">{iface.duplex}</span>{/if}
    </div>
  {/if}
  {#if showTraffic && (iface.txRate != null || iface.rxRate != null)}
    <div class="ui-nig__traffic">
      {#if iface.txRate != null}<span class="ui-nig__traffic-item"><span class="ui-nig__traffic-arrow ui-nig__traffic-arrow--tx" aria-hidden="true">{'↑'}</span><span class="ui-nig__traffic-value">{rate(iface.txRate)}</span></span>{/if}
      {#if iface.rxRate != null}<span class="ui-nig__traffic-item"><span class="ui-nig__traffic-arrow ui-nig__traffic-arrow--rx" aria-hidden="true">{'↓'}</span><span class="ui-nig__traffic-value">{rate(iface.rxRate)}</span></span>{/if}
    </div>
  {/if}
  {#if showErrors && (iface.txErrors != null || iface.rxErrors != null)}
    <div class="ui-nig__errors">
      {#if iface.txErrors != null}<span class={errClass(iface.txErrors)}>TX err: {iface.txErrors}</span>{/if}
      {#if iface.rxErrors != null}<span class={errClass(iface.rxErrors)}>RX err: {iface.rxErrors}</span>{/if}
    </div>
  {/if}
{/snippet}

<ErrorBoundary>
  <div
    class={cn('ui-network-interface-grid', className)}
    data-motion={motionLevel()}
    data-size={size}
    data-compact={compact ? '' : undefined}
    data-columns={columns != null ? '' : undefined}
    role="group"
    aria-label="Network interfaces"
    use:cssProps={styles}
    {...rest}
  >
    {#each interfaces as iface (iface.name)}
      <div class="ui-nig__card" data-status={iface.status} data-motion={motionLevel()}>
        {#if onInterfaceClick}
          <button class="ui-nig__card-btn" onclick={() => onInterfaceClick(iface)} aria-label={label(iface)}>{@render card(iface)}</button>
        {:else}{@render card(iface)}{/if}
      </div>
    {/each}
  </div>
</ErrorBoundary>
