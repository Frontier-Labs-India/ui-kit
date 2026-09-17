<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import ErrorBoundary from '../lib/ErrorBoundary.svelte'
  import { cssProps } from '../actions/css-props.js'
  import { mergeStyles, reactStyle, type StyleInput } from '../lib/react-style.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  export interface VlanEntry {
    id: number
    name?: string
    color?: string
    ports: number[]
    tagged?: boolean
  }

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'style'> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    vlans: VlanEntry[]
    totalPorts: number
    showLabels?: boolean
    showPortNumbers?: boolean
    orientation?: 'horizontal' | 'vertical'
    size?: 'sm' | 'md' | 'lg'
    onVlanClick?: (vlan: VlanEntry) => void
    onPortClick?: (port: number, vlans: VlanEntry[]) => void
    motion?: MotionLevel
    highlightPorts?: number[]
    highlightVlans?: number[]
    showTrunkIndicator?: boolean
    compactMode?: boolean
    maxHeight?: number | string
    colorScheme?: 'auto' | 'categorical' | 'sequential'
    onPortHover?: (port: number | null) => void
    onVlanHover?: (vlan: VlanEntry | null) => void
    style?: StyleInput
    class?: string
  }

  const SIZES = {
    sm: { rowHeight: 16, tickWidth: 12, labelWidth: 80, fontSize: 0.625, portFontSize: 0.5, padding: 2 },
    md: { rowHeight: 22, tickWidth: 16, labelWidth: 110, fontSize: 0.75, portFontSize: 0.625, padding: 3 },
    lg: { rowHeight: 30, tickWidth: 22, labelWidth: 140, fontSize: 0.875, portFontSize: 0.75, padding: 4 },
  } as const
  function autoColor(i: number, scheme: 'auto' | 'categorical' | 'sequential', total: number): string {
    if (scheme === 'sequential') return `oklch(${75 - (i / Math.max(total - 1, 1)) * 30}% 0.15 250)`
    return `oklch(65% 0.15 ${(i * 137.508) % 360})` // golden-angle hue rotation
  }

  let {
    vlans, totalPorts, showLabels = true, showPortNumbers = false, orientation = 'horizontal', size = 'md', onVlanClick, onPortClick,
    motion, highlightPorts, highlightVlans, showTrunkIndicator = false, compactMode = false, maxHeight, colorScheme = 'auto',
    onPortHover, onVlanHover, class: className, style, ref = $bindable(null), ...rest
  }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)
  let hoveredVlan = $state<number | null>(null)
  let hoveredPort = $state<number | null>(null)
  let tooltip = $state<{ x: number; y: number; title: string; details: string[] } | null>(null)

  // Compact mode forces the small size and hides labels and port numbers.
  const effSize = $derived(compactMode ? 'sm' : size)
  const labels = $derived(compactMode ? false : showLabels)
  const portNumbers = $derived(compactMode ? false : showPortNumbers)
  const c = $derived(SIZES[effSize])
  const labelW = $derived(labels ? c.labelWidth : 0)
  const gap = $derived(c.padding)
  const chartW = $derived(totalPorts * c.tickWidth)
  const totalW = $derived(labelW + chartW + gap * 2)
  const totalH = $derived(vlans.length * (c.rowHeight + gap) + gap + (portNumbers ? c.rowHeight : 0) + (showTrunkIndicator ? c.rowHeight : 0))
  const vertical = $derived(orientation === 'vertical')
  const tickBottom = $derived(vlans.length * (c.rowHeight + gap) + gap)
  const connectorR = $derived(Math.max(2, c.tickWidth / 6))

  const portVlans = $derived.by(() => {
    const m = new Map<number, VlanEntry[]>()
    for (let p = 1; p <= totalPorts; p++) {
      const inPort = vlans.filter(v => v.ports.includes(p))
      if (inPort.length) m.set(p, inPort)
    }
    return m
  })
  const colors = $derived(vlans.map((v, i) => v.color || autoColor(i, colorScheme, vlans.length)))
  const hlPorts = $derived(new Set(highlightPorts ?? []))
  const hlVlans = $derived(new Set(highlightVlans ?? []))
  const anyHighlight = $derived(hlPorts.size > 0 || hlVlans.size > 0 || hoveredPort !== null || hoveredVlan !== null)

  function portHl(port: number): boolean {
    if (hlPorts.has(port) || hoveredPort === port) return true
    if (hoveredVlan !== null && vlans.find(v => v.id === hoveredVlan)?.ports.includes(port)) return true
    for (const id of hlVlans) if (vlans.find(v => v.id === id)?.ports.includes(port)) return true
    return false
  }
  function vlanHl(v: VlanEntry): boolean {
    if (hlVlans.has(v.id) || hoveredVlan === v.id) return true
    if (hoveredPort !== null && v.ports.includes(hoveredPort)) return true
    for (const p of hlPorts) if (v.ports.includes(p)) return true
    return false
  }

  function enterVlan(e: MouseEvent, v: VlanEntry) {
    const rect = (e.target as Element).getBoundingClientRect()
    const parent = (e.target as Element).closest('.ui-vlan-bus-bar')?.getBoundingClientRect()
    if (!parent) return
    hoveredVlan = v.id
    onVlanHover?.(v)
    tooltip = {
      x: rect.left - parent.left + rect.width / 2,
      y: rect.top - parent.top,
      title: `VLAN ${v.id}${v.name ? ` — ${v.name}` : ''}`,
      details: [`${v.ports.length} port${v.ports.length !== 1 ? 's' : ''}`, v.tagged ? 'Tagged (trunk)' : 'Untagged (access)'],
    }
  }
  function leaveVlan() { hoveredVlan = null; onVlanHover?.(null); tooltip = null }
  function enterPort(p: number) { hoveredPort = p; onPortHover?.(p) }
  function leavePort() { hoveredPort = null; onPortHover?.(null) }

  const styles = $derived(mergeStyles(
    vertical ? { writingMode: 'initial' } : null,
    maxHeight != null ? { maxBlockSize: maxHeight, overflow: 'auto' } : null,
    style,
  ))
  const trunkClass = (p: number) =>
    showTrunkIndicator && portVlans.get(p)?.some(v => v.tagged) ? 'ui-vlan-bus-bar__trunk-indicator--trunk'
      : portVlans.has(p) ? 'ui-vlan-bus-bar__trunk-indicator--access' : ''
</script>

{#snippet content()}
  {#each vlans as vlan, vi (vlan.id)}
    {@const y = gap + vi * (c.rowHeight + gap)}
    {@const color = colors[vi]}
    {@const hl = vlanHl(vlan)}
    {@const dimmed = anyHighlight && !hl}
    <g data-testid={`vlan-row-${vlan.id}`}>
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <rect class="ui-vlan-bus-bar__row-bg" x={labelW} {y} width={chartW + gap * 2} height={c.rowHeight} onmouseenter={e => enterVlan(e, vlan)} onmouseleave={leaveVlan} />
      {#if labels}<text class="ui-vlan-bus-bar__label" x={labelW - gap} y={y + c.rowHeight / 2} font-size={c.fontSize + 'rem'}>{vlan.name || `VLAN ${vlan.id}`}</text>{/if}
      {#each Array.from({ length: totalPorts }) as _, pi (pi)}
        {#if vlan.ports.includes(pi + 1)}
          {@const segHl = anyHighlight && hl && portHl(pi + 1)}
          <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
          <rect
            class={cn('ui-vlan-bus-bar__segment', onVlanClick && 'ui-vlan-bus-bar__segment--clickable', dimmed && !segHl && 'ui-vlan-bus-bar__segment--dimmed', segHl && 'ui-vlan-bus-bar__segment--highlighted', vlan.tagged && 'ui-vlan-bus-bar__segment--tagged', !vlan.tagged && 'ui-vlan-bus-bar__segment--untagged')}
            x={labelW + gap + pi * c.tickWidth + 1}
            {y}
            width={c.tickWidth - 2}
            height={c.rowHeight}
            rx={2}
            fill={color}
            fill-opacity={segHl ? 0.9 : 0.7}
            stroke={vlan.tagged ? color : segHl ? color : 'none'}
            onmouseenter={e => enterVlan(e, vlan)}
            onmouseleave={leaveVlan}
            onclick={onVlanClick ? () => onVlanClick(vlan) : undefined}
          />
        {/if}
      {/each}
      {#each Array.from({ length: totalPorts }) as _, pi (pi)}
        {#if vlan.ports.includes(pi + 1)}
          {@const connDimmed = anyHighlight && !(hl && portHl(pi + 1))}
          <circle
            class={cn('ui-vlan-bus-bar__connector', connDimmed && 'ui-vlan-bus-bar__connector--dimmed', !connDimmed && anyHighlight && 'ui-vlan-bus-bar__connector--highlighted')}
            cx={labelW + gap + pi * c.tickWidth + c.tickWidth / 2}
            cy={y + c.rowHeight}
            r={connectorR}
            fill={color}
            fill-opacity={0.9}
          />
        {/if}
      {/each}
    </g>
  {/each}
  {#each Array.from({ length: totalPorts }) as _, pi (pi)}
    {@const port = pi + 1}
    {@const x = labelW + gap + pi * c.tickWidth + c.tickWidth / 2}
    {@const tickHl = hoveredPort === port || portHl(port)}
    <g>
      <line class={cn('ui-vlan-bus-bar__tick', tickHl && 'ui-vlan-bus-bar__tick--highlighted')} x1={x} y1={0} x2={x} y2={tickBottom} opacity={tickHl ? 0.4 : 0.15} />
      <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
      <rect
        class={cn('ui-vlan-bus-bar__port-tick-area', onPortClick && 'ui-vlan-bus-bar__port-tick-area--clickable')}
        x={labelW + gap + pi * c.tickWidth}
        y={0}
        width={c.tickWidth}
        height={tickBottom}
        onmouseenter={() => enterPort(port)}
        onmouseleave={leavePort}
        onclick={onPortClick ? () => onPortClick(port, portVlans.get(port) || []) : undefined}
      />
      {#if portNumbers}<text class="ui-vlan-bus-bar__port-label" {x} y={tickBottom + gap} font-size={c.portFontSize + 'rem'}>{port}</text>{/if}
      {#if showTrunkIndicator}
        <text class={cn('ui-vlan-bus-bar__trunk-indicator', trunkClass(port))} {x} y={tickBottom + (portNumbers ? c.rowHeight : 0) + gap} font-size={c.portFontSize + 'rem'}>{portVlans.has(port) ? (portVlans.get(port)!.some(v => v.tagged) ? 'T' : 'A') : ''}</text>
      {/if}
    </g>
  {/each}
{/snippet}

<ErrorBoundary>
  <div
    class={cn('ui-vlan-bus-bar', className)}
    data-motion={motionLevel()}
    data-size={effSize}
    data-orientation={orientation}
    data-compact={compactMode ? '' : undefined}
    role="img"
    aria-label={`VLAN bus bar diagram showing ${vlans.length} VLANs across ${totalPorts} ports`}
    use:cssProps={styles}
    bind:this={ref}
    {...rest}
  >
    <svg class="ui-vlan-bus-bar__svg" width={vertical ? totalH : totalW} height={vertical ? totalW : totalH} viewBox={vertical ? `0 0 ${totalH} ${totalW}` : `0 0 ${totalW} ${totalH}`} aria-hidden="true">
      {#if vertical}
        <!-- React's transform, verbatim — including its (totalH - totalH) / 2 term. -->
        <g transform={`rotate(90 ${totalH / 2} ${totalH / 2}) translate(${(totalH - totalW) / 2} ${(totalH - totalH) / 2})`}>{@render content()}</g>
      {:else}{@render content()}{/if}
    </svg>
    {#if tooltip}
      <div class="ui-vlan-bus-bar__tooltip" use:cssProps={reactStyle({ left: tooltip.x, top: tooltip.y })}>
        <div class="ui-vlan-bus-bar__tooltip-title">{tooltip.title}</div>
        {#each tooltip.details as d, i (i)}<div class="ui-vlan-bus-bar__tooltip-detail">{d}</div>{/each}
      </div>
    {/if}
  </div>
</ErrorBoundary>
