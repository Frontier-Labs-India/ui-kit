<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import { cssProps } from '../actions/css-props.js'
  import { mergeStyles, reactStyle, type StyleInput, type StyleObject } from '../lib/react-style.js'
  import Content from '../lib/Content.svelte'
  import ErrorBoundary from '../lib/ErrorBoundary.svelte'
  import UpstreamGroup from '../lib/UpstreamGroup.svelte'
  import { sparklinePaths } from '../lib/sparkline.js'
  import {
    computeUtilization, formatBitRateSplit, formatRelativeTime, formatTraffic, utilColor, type UpstreamLink,
  } from '../lib/upstream-dashboard.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  type Display = 'bar' | 'meter' | 'ambient'
  type GroupBy = 'vendor' | 'location' | 'none'

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'style'> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    /** Array of upstream links — drives the entire dashboard */
    links: UpstreamLink[]
    /** Dashboard title */
    title?: string | Snippet
    /** Visualization mode; unset (and no `compact`) renders the legacy card grid */
    mode?: 'hero' | 'compact' | 'table'
    /** Show aggregated summary at top */
    showSummary?: boolean
    /** Group links */
    groupBy?: GroupBy
    /** Last updated timestamp */
    lastUpdated?: number | Date
    motion?: MotionLevel
    /** Show capacity info */
    showCapacity?: boolean
    /** Show burstable capacity */
    showBurstCapacity?: boolean
    /** Show utilization percentage */
    showUtilization?: boolean
    /** How to display utilization: 'bar' (default), 'meter' (arc gauge), 'ambient' (bg color shift) */
    utilizationDisplay?: Display
    /** Called when a link card is clicked */
    onLinkClick?: (link: UpstreamLink) => void
    /** Called when a group header is clicked */
    onGroupClick?: (groupName: string, links: UpstreamLink[]) => void
    /** Called when the summary/hero area is clicked */
    onSummaryClick?: () => void
    /** @deprecated Use mode='compact' instead */
    compact?: boolean
    style?: StyleInput
    class?: string
  }

  let {
    links, title, mode, showSummary = false, groupBy = 'none', compact = false, lastUpdated, motion,
    showCapacity = true, showBurstCapacity = false, showUtilization = true, utilizationDisplay = 'bar',
    onLinkClick, onGroupClick, onSummaryClick, class: className, style, ref = $bindable(null), ...rest
  }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)
  // Explicit mode prop > compact legacy prop > the legacy grid (React's comment says "default hero"; its code does not).
  const effectiveMode = $derived(mode ?? (compact ? 'compact' : undefined))
  const isEmpty = $derived(links.length === 0)

  function group(list: UpstreamLink[], by: GroupBy): [string, UpstreamLink[]][] | null {
    if (by === 'none') return null
    const map = new Map<string, UpstreamLink[]>()
    for (const link of list) {
      const key = by === 'vendor' ? link.vendor : link.location
      const arr = map.get(key) || []
      arr.push(link)
      map.set(key, arr)
    }
    return Array.from(map.entries())
  }
  const groups = $derived(group(links, groupBy))

  const sum = (list: UpstreamLink[], pick: (l: UpstreamLink) => number) => list.reduce((s, l) => s + pick(l), 0)
  const totalIn = $derived(sum(links, l => l.inbound))
  const totalOut = $derived(sum(links, l => l.outbound))
  const totalCap = $derived(sum(links, l => l.capacity ?? 0))
  const totalBurst = $derived(sum(links, l => l.burstCapacity ?? 0))
  const inFmt = $derived(formatBitRateSplit(totalIn))
  const outFmt = $derived(formatBitRateSplit(totalOut))
  const totalFmt = $derived(formatBitRateSplit(totalIn + totalOut))

  /* Hero: one trend from every link with two or more points, the shorter ones
   * held at their last value. */
  const aggregatedTrend = $derived.by(() => {
    const trendsWithData = links.filter(l => l.trend && l.trend.length >= 2)
    if (trendsWithData.length === 0) return null
    const maxLen = Math.max(...trendsWithData.map(l => l.trend!.length))
    const result: number[] = []
    for (let i = 0; i < maxLen; i++) {
      let s = 0
      for (const l of trendsWithData) s += l.trend![Math.min(i, l.trend!.length - 1)]
      result.push(s)
    }
    return result
  })
  const heroTrend = $derived(aggregatedTrend ? sparklinePaths(aggregatedTrend, 200, 60, 2) : null)

  const statusCounts = $derived(links.reduce((acc, l) => { acc[l.status] = (acc[l.status] || 0) + 1; return acc }, {} as Record<string, number>))
  const updatedTs = $derived(lastUpdated ? (typeof lastUpdated === 'number' ? lastUpdated : lastUpdated.getTime()) : null)

  const tableLinks = $derived(groupBy === 'none' ? links : [...links].sort((a, b) => {
    const keyA = groupBy === 'vendor' ? a.vendor : a.location
    const keyB = groupBy === 'vendor' ? b.vendor : b.location
    return keyA.localeCompare(keyB)
  }))

  function ambientTint(utilPct: number | null): StyleObject | undefined {
    if (utilPct === null || utilPct < 40) return undefined
    if (utilPct < 70) return { background: 'oklch(80% 0.18 85 / 0.03)' }
    if (utilPct < 90) return { background: 'oklch(80% 0.18 85 / 0.05)' }
    return { background: 'oklch(62% 0.22 25 / 0.05)' }
  }

  /* Enter and Space activate a clickable card, as React's onKeyDown does. */
  const activate = (fn: () => void) => (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn() }
  }

  const styles = $derived(mergeStyles(style))
</script>

{#snippet inboundArrow()}<span class="ui-upstream-dashboard__arrow ui-upstream-dashboard__arrow--inbound"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M7 2v10M3 8l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg></span>{/snippet}

{#snippet outboundArrow()}<span class="ui-upstream-dashboard__arrow ui-upstream-dashboard__arrow--outbound"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M7 12V2M3 6l4-4 4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg></span>{/snippet}

{#snippet inlineSparkline(data: number[], w: number, h: number)}
  {@const p = sparklinePaths(data, w, h)}
  {#if p}
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <path d={p.area} fill="oklch(65% 0.2 270 / 0.15)" />
      <path d={p.line} fill="none" stroke="oklch(65% 0.2 270)" stroke-width="1" />
    </svg>
  {/if}
{/snippet}

{#snippet utilBar(percent: number, capacity: number | undefined, burst: number | undefined)}
  <!-- React's `burst && capacity && burst > capacity && <marker/>` renders a 0 when either is 0. -->
  {@const marker = burst && capacity && burst > capacity}
  {@const burstPct = burst && capacity ? Math.round((capacity / burst) * 100) : 100}
  <div class="ui-upstream-dashboard__util-bar">
    <div class="ui-upstream-dashboard__util-fill" use:cssProps={reactStyle({ width: `${Math.min(percent, 100)}%`, background: utilColor(percent) })}></div>
    {#if marker}
      <div class="ui-upstream-dashboard__util-burst-marker" use:cssProps={reactStyle({ left: `${burstPct}%` })} title="Committed capacity"></div>
    {:else if typeof marker === 'number'}{marker}{/if}
    <span class="ui-upstream-dashboard__util-label">{percent}%</span>
  </div>
{/snippet}

{#snippet utilMeter(percent: number)}
  {@const color = percent > 80 ? 'var(--status-critical, oklch(62% 0.22 25))' : percent > 60 ? 'var(--status-warning, oklch(80% 0.18 85))' : 'var(--status-ok, oklch(72% 0.19 155))'}
  {@const angle = (percent / 100) * 180}
  {@const rad = (angle * Math.PI) / 180}
  {@const x = 20 + 18 * Math.cos(Math.PI - rad)}
  {@const y = 20 - 18 * Math.sin(Math.PI - rad)}
  {@const largeArc = angle > 180 ? 1 : 0}
  <svg width="40" height="24" viewBox="0 0 40 24" aria-hidden="true">
    <path d="M 2 22 A 18 18 0 0 1 38 22" fill="none" stroke="var(--border-default, oklch(100% 0 0 / 0.1))" stroke-width="3" />
    <path d={`M 2 22 A 18 18 0 ${largeArc} 1 ${x} ${y}`} fill="none" stroke={color} stroke-width="3" stroke-linecap="round" />
    <text x="20" y="20" text-anchor="middle" fill="var(--text-primary, oklch(90% 0 0))" font-size="8" font-weight="700">{percent}%</text>
  </svg>
{/snippet}

{#snippet miniCard(link: UpstreamLink, label: string | undefined)}
  {@const lIn = formatBitRateSplit(link.inbound)}
  {@const lOut = formatBitRateSplit(link.outbound)}
  {@const utilPct = link.capacity ? Math.round(((link.inbound + link.outbound) / link.capacity) * 100) : 0}
  {@const capFmt = link.capacity ? formatBitRateSplit(link.capacity) : null}
  {@const burstFmt = link.burstCapacity ? formatBitRateSplit(link.burstCapacity) : null}
  {@const showUtil = showUtilization && link.capacity != null && utilizationDisplay !== 'ambient'}
  {@const capText = (showCapacity && capFmt ? `${capFmt.value}${capFmt.unit}` : '') + (showBurstCapacity && burstFmt ? ` / ${burstFmt.value}${burstFmt.unit}` : '') + (utilPct > 0 && showUtilization ? ` · ${utilPct}%` : '')}
  <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions (as React: tabindex, role and handlers are set together, only with a callback) -->
  <div
    class="ui-upstream-dashboard__mini-card"
    data-status={link.status}
    data-clickable={onLinkClick ? '' : undefined}
    tabindex={onLinkClick ? 0 : undefined}
    role={onLinkClick ? 'button' : undefined}
    onkeydown={onLinkClick ? activate(() => onLinkClick?.(link)) : undefined}
    onclick={onLinkClick ? () => onLinkClick?.(link) : undefined}
    use:cssProps={reactStyle(utilizationDisplay === 'ambient' ? ambientTint(utilPct) : undefined)}
  >
    <div class="ui-upstream-dashboard__mini-card-header">
      <span class="ui-upstream-dashboard__mini-card-status"></span>
      <span class="ui-upstream-dashboard__mini-card-label">{label ?? `${link.vendor} · ${link.location}`}</span>
      <div class="ui-upstream-dashboard__mini-card-metrics">
        <span use:cssProps={{ color: 'oklch(72% 0.19 155)' }}>↓{lIn.value}<small>{lIn.unit}</small></span>
        <span use:cssProps={{ color: 'oklch(65% 0.2 270)' }}>↑{lOut.value}<small>{lOut.unit}</small></span>
      </div>
    </div>
    {#if showUtil || (showCapacity && capFmt)}
      <div class="ui-upstream-dashboard__mini-card-util-row">
        {#if showUtil}
          <div class="ui-upstream-dashboard__util-bar-wrap">
            {#if utilizationDisplay === 'meter'}{@render utilMeter(utilPct)}{:else}{@render utilBar(utilPct, link.capacity, link.burstCapacity)}{/if}
          </div>
        {/if}
        {#if capText}<span class="ui-upstream-dashboard__mini-card-util-text">{capText}</span>{/if}
      </div>
    {/if}
  </div>
{/snippet}

{#snippet groupCard(groupName: string, groupLinks: UpstreamLink[])}
  {@const gIn = sum(groupLinks, l => l.inbound)}
  {@const gOut = sum(groupLinks, l => l.outbound)}
  {@const gCap = sum(groupLinks, l => l.capacity ?? 0)}
  {@const gBurst = sum(groupLinks, l => l.burstCapacity ?? 0)}
  {@const utilPct = gCap > 0 ? Math.round(((gIn + gOut) / gCap) * 100) : 0}
  <div class="ui-upstream-dashboard__group-card">
    <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions (as React: tabindex, role and handlers are set together, only with a callback) -->
    <div
      class="ui-upstream-dashboard__group-card-header"
      data-clickable={onGroupClick ? '' : undefined}
      tabindex={onGroupClick ? 0 : undefined}
      role={onGroupClick ? 'button' : undefined}
      onkeydown={onGroupClick ? activate(() => onGroupClick?.(groupName, groupLinks)) : undefined}
      onclick={onGroupClick ? () => onGroupClick?.(groupName, groupLinks) : undefined}
    >
      <span class="ui-upstream-dashboard__group-card-name">{groupName}</span>
      <span class="ui-upstream-dashboard__group-card-metrics"><span use:cssProps={{ color: 'oklch(72% 0.19 155)' }}>↓{formatTraffic(gIn)}</span><span use:cssProps={{ color: 'oklch(65% 0.2 270)' }}>↑{formatTraffic(gOut)}</span></span>
      {#if showCapacity && gCap > 0}<span class="ui-upstream-dashboard__group-card-cap">Cap: {formatTraffic(gCap)}</span>{/if}
      {#if showUtilization && gCap > 0}<span class="ui-upstream-dashboard__group-card-util">{@render utilBar(utilPct, gCap, gBurst > 0 ? gBurst : undefined)}</span>{/if}
    </div>
    <div class="ui-upstream-dashboard__group-card-children">
      {#each groupLinks as link}{@render miniCard(link, groupBy === 'vendor' ? link.location : link.vendor)}{/each}
    </div>
  </div>
{/snippet}

{#snippet summaryCard()}
  <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions (as React: tabindex, role and handlers are set together, only with a callback) -->
  <div
    class="ui-upstream-dashboard__summary"
    role="region"
    aria-label="Upstream Traffic Summary"
    data-clickable={onSummaryClick ? '' : undefined}
    tabindex={onSummaryClick ? 0 : undefined}
    onclick={onSummaryClick}
    onkeydown={onSummaryClick ? activate(onSummaryClick) : undefined}
  >
    <h3 class="ui-upstream-dashboard__summary-title">Upstream Traffic Summary</h3>
    <div class="ui-upstream-dashboard__metric">
      <span class="ui-upstream-dashboard__metric-label">{@render inboundArrow()} Inbound</span>
      <span class="ui-upstream-dashboard__metric-value" data-testid="summary-inbound">{inFmt.value}<span class="ui-upstream-dashboard__metric-unit">{inFmt.unit}</span></span>
    </div>
    <div class="ui-upstream-dashboard__metric">
      <span class="ui-upstream-dashboard__metric-label">{@render outboundArrow()} Outbound</span>
      <span class="ui-upstream-dashboard__metric-value" data-testid="summary-outbound">{outFmt.value}<span class="ui-upstream-dashboard__metric-unit">{outFmt.unit}</span></span>
    </div>
    <div class="ui-upstream-dashboard__metric">
      <span class="ui-upstream-dashboard__metric-label">Total</span>
      <span class="ui-upstream-dashboard__metric-value" data-testid="summary-total">{totalFmt.value}<span class="ui-upstream-dashboard__metric-unit">{totalFmt.unit}</span></span>
    </div>
    <div class="ui-upstream-dashboard__summary-footer">
      <span>{links.length} Links</span>
      {#if (statusCounts.ok ?? 0) > 0}<span class="ui-upstream-dashboard__summary-sep" aria-hidden="true">&bull;</span><span>{statusCounts.ok} Healthy</span>{/if}
      {#if (statusCounts.warning ?? 0) > 0}<span class="ui-upstream-dashboard__summary-sep" aria-hidden="true">&bull;</span><span>{statusCounts.warning} Warning</span>{/if}
      {#if (statusCounts.critical ?? 0) > 0}<span class="ui-upstream-dashboard__summary-sep" aria-hidden="true">&bull;</span><span>{statusCounts.critical} Critical</span>{/if}
      <!-- React's `{updatedTs && …}` renders NaN for an invalid Date. -->
      {#if updatedTs}<span class="ui-upstream-dashboard__summary-updated">Last updated: {formatRelativeTime(updatedTs)}</span>{:else if Number.isNaN(updatedTs)}NaN{/if}
    </div>
  </div>
{/snippet}

{#snippet topMetrics()}
  <div class="ui-upstream-dashboard__hero-metric">
    <span class="ui-upstream-dashboard__table-top-value"><span class="ui-upstream-dashboard__table-top-direction ui-upstream-dashboard__table-top-direction--in" aria-hidden="true">↓</span>{inFmt.value}<span class="ui-upstream-dashboard__table-top-unit">{inFmt.unit}</span></span>
    <span class="ui-upstream-dashboard__table-top-label">Inbound</span>
  </div>
  <div class="ui-upstream-dashboard__hero-metric">
    <span class="ui-upstream-dashboard__table-top-value"><span class="ui-upstream-dashboard__table-top-direction ui-upstream-dashboard__table-top-direction--out" aria-hidden="true">↑</span>{outFmt.value}<span class="ui-upstream-dashboard__table-top-unit">{outFmt.unit}</span></span>
    <span class="ui-upstream-dashboard__table-top-label">Outbound</span>
  </div>
{/snippet}

{#snippet splitBar(label: string, color: string, fmt: { value: string; unit: string }, total: number)}
  <div use:cssProps={reactStyle({ flex: 1 })}>
    <div use:cssProps={reactStyle({ display: 'flex', justifyContent: 'space-between', fontSize: '0.625rem', color: 'var(--text-tertiary)', marginBlockEnd: '0.25rem' })}>
      <span use:cssProps={{ color }}>{label}: {fmt.value} {fmt.unit}</span>
      <span>{Math.round((total / totalCap) * 100)}%</span>
    </div>
    <div use:cssProps={reactStyle({ height: 4, borderRadius: 2, background: 'var(--bg-base)', overflow: 'hidden' })}>
      <div use:cssProps={reactStyle({ height: '100%', borderRadius: 2, width: `${Math.min(100, Math.round((total / totalCap) * 100))}%`, background: color, transition: 'width 0.3s' })}></div>
    </div>
  </div>
{/snippet}

{#snippet heroView()}
  {@const utilPct = computeUtilization(links)}
  {@const capFmt = totalCap > 0 ? formatBitRateSplit(totalCap) : null}
  {@const burstCapFmt = totalBurst > 0 ? formatBitRateSplit(totalBurst) : null}
  <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions (as React: tabindex, role and handlers are set together, only with a callback) -->
  <div
    class="ui-upstream-dashboard__hero-card"
    data-testid="hero-card"
    use:cssProps={reactStyle(utilizationDisplay === 'ambient' ? ambientTint(utilPct) : undefined)}
    data-clickable={onSummaryClick ? '' : undefined}
    tabindex={onSummaryClick ? 0 : undefined}
    role={onSummaryClick ? 'button' : undefined}
    onclick={onSummaryClick}
    onkeydown={onSummaryClick ? activate(onSummaryClick) : undefined}
  >
    {#if heroTrend}
      <div class="ui-upstream-dashboard__hero-trendline" aria-hidden="true">
        <svg viewBox="0 0 200 60" preserveAspectRatio="none">
          <defs>
            <linearGradient id="hero-trend-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="oklch(65% 0.2 270)" stop-opacity="0.12" />
              <stop offset="100%" stop-color="oklch(65% 0.2 270)" stop-opacity="0" />
            </linearGradient>
          </defs>
          <path d={heroTrend.area} fill="url(#hero-trend-fill)" />
          <path d={heroTrend.line} fill="none" stroke="oklch(65% 0.2 270)" stroke-width="1.5" stroke-opacity="0.15" />
        </svg>
      </div>
    {/if}
    <div class="ui-upstream-dashboard__hero-metrics">
      <div class="ui-upstream-dashboard__hero-metric">
        <span class="ui-upstream-dashboard__hero-value"><span class="ui-upstream-dashboard__hero-direction ui-upstream-dashboard__hero-direction--in" aria-hidden="true">↓</span>{inFmt.value}<span class="ui-upstream-dashboard__hero-unit">{inFmt.unit}</span></span>
        <span class="ui-upstream-dashboard__hero-label">Inbound</span>
      </div>
      <div class="ui-upstream-dashboard__hero-metric">
        <span class="ui-upstream-dashboard__hero-value"><span class="ui-upstream-dashboard__hero-direction ui-upstream-dashboard__hero-direction--out" aria-hidden="true">↑</span>{outFmt.value}<span class="ui-upstream-dashboard__hero-unit">{outFmt.unit}</span></span>
        <span class="ui-upstream-dashboard__hero-label">Outbound</span>
      </div>
    </div>
    <div class="ui-upstream-dashboard__hero-util-section" use:cssProps={reactStyle({ position: 'relative', zIndex: 1 })}>
      {#if totalCap > 0}
        <div use:cssProps={reactStyle({ display: 'flex', gap: '1rem', alignItems: 'center', marginBlockEnd: '0.5rem' })}>
          {@render splitBar('↓ Rx', 'oklch(72% 0.19 155)', inFmt, totalIn)}
          {@render splitBar('↑ Tx', 'oklch(65% 0.2 270)', outFmt, totalOut)}
        </div>
      {/if}
      {#if utilPct !== null && showUtilization && utilizationDisplay !== 'ambient'}
        {#if utilizationDisplay === 'meter'}
          <div use:cssProps={reactStyle({ display: 'flex', justifyContent: 'center' })}>{@render utilMeter(utilPct)}</div>
        {:else}
          {@render utilBar(utilPct, totalCap, totalBurst > 0 ? totalBurst : undefined)}
        {/if}
      {/if}
    </div>
    <div class="ui-upstream-dashboard__hero-footer">
      <span class="ui-upstream-dashboard__hero-footer-item">Total: {totalFmt.value} {totalFmt.unit}</span>
      {#if showCapacity && capFmt}<span class="ui-upstream-dashboard__hero-footer-item">Capacity: {capFmt.value} {capFmt.unit}</span>{/if}
      {#if showBurstCapacity && burstCapFmt}<span class="ui-upstream-dashboard__hero-footer-item">Burst: {burstCapFmt.value} {burstCapFmt.unit}</span>{/if}
      {#if showUtilization && utilPct !== null}<span class="ui-upstream-dashboard__hero-footer-item">{utilPct}% used</span>{/if}
    </div>
  </div>
  {#if groups}
    <div class="ui-upstream-dashboard__hero-groups-grid">
      {#each groups as [key, groupLinks] (key)}{@render groupCard(key, groupLinks)}{/each}
    </div>
  {:else}
    <div class="ui-upstream-dashboard__hero-mini-grid">
      {#each links as link}{@render miniCard(link, undefined)}{/each}
    </div>
  {/if}
{/snippet}

{#snippet compactCard(link: UpstreamLink)}
  {@const lIn = formatBitRateSplit(link.inbound)}
  {@const lOut = formatBitRateSplit(link.outbound)}
  {@const utilPct = link.capacity ? Math.min(100, Math.round(((link.inbound + link.outbound) / link.capacity) * 100)) : null}
  <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions (as React: tabindex, role and handlers are set together, only with a callback) -->
  <div
    class="ui-upstream-dashboard__compact-card"
    data-status={link.status}
    role="group"
    aria-label={`${link.vendor} ${link.location}`}
    data-clickable={onLinkClick ? '' : undefined}
    tabindex={onLinkClick ? 0 : undefined}
    onclick={onLinkClick ? () => onLinkClick?.(link) : undefined}
    onkeydown={onLinkClick ? activate(() => onLinkClick?.(link)) : undefined}
  >
    <div class="ui-upstream-dashboard__compact-header">
      <span class="ui-upstream-dashboard__compact-dot"></span>
      <span>{link.vendor}</span>
      <span aria-hidden="true">·</span>
      <span>{link.location}</span>
    </div>
    <div class="ui-upstream-dashboard__compact-metrics">
      <span class="ui-upstream-dashboard__compact-value"><span class="ui-upstream-dashboard__compact-direction ui-upstream-dashboard__compact-direction--in" aria-hidden="true">↓</span>{lIn.value}<span class="ui-upstream-dashboard__compact-value-unit">{lIn.unit}</span></span>
      <span class="ui-upstream-dashboard__compact-value"><span class="ui-upstream-dashboard__compact-direction ui-upstream-dashboard__compact-direction--out" aria-hidden="true">↑</span>{lOut.value}<span class="ui-upstream-dashboard__compact-value-unit">{lOut.unit}</span></span>
    </div>
    <div class="ui-upstream-dashboard__compact-footer">
      {#if link.trend && link.trend.length >= 2}<span class="ui-upstream-dashboard__compact-sparkline">{@render inlineSparkline(link.trend, 60, 16)}</span>{/if}
      {#if utilPct !== null}
        <span class="ui-upstream-dashboard__compact-util">
          <span class="ui-upstream-dashboard__compact-util-bar"><span class="ui-upstream-dashboard__compact-util-fill" use:cssProps={reactStyle({ display: 'block', width: `${utilPct}%`, height: '100%', borderRadius: 1, background: utilColor(utilPct) })}></span></span>
          <span>{utilPct}%</span>
        </span>
      {/if}
    </div>
  </div>
{/snippet}

{#snippet compactView()}
  {@const utilPct = totalCap > 0 ? Math.min(100, Math.round(((totalIn + totalOut) / totalCap) * 100)) : null}
  <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions (as React: tabindex, role and handlers are set together, only with a callback) -->
  <div
    class="ui-upstream-dashboard__compact-summary"
    data-clickable={onSummaryClick ? '' : undefined}
    tabindex={onSummaryClick ? 0 : undefined}
    role={onSummaryClick ? 'button' : undefined}
    onclick={onSummaryClick}
    onkeydown={onSummaryClick ? activate(onSummaryClick) : undefined}
  >
    <div class="ui-upstream-dashboard__hero-metrics">{@render topMetrics()}</div>
    <div class="ui-upstream-dashboard__hero-footer">
      <span class="ui-upstream-dashboard__hero-footer-item">Total: {totalFmt.value} {totalFmt.unit}</span>
      {#if utilPct !== null}<span class="ui-upstream-dashboard__hero-footer-item">{utilPct}% used</span>{/if}
    </div>
  </div>
  {#if groups}
    {#each groups as [key, groupLinks] (key)}
      <UpstreamGroup groupKey={key} links={groupLinks} gridClass="ui-upstream-dashboard__compact-grid" card={compactCard} {onGroupClick} />
    {/each}
  {:else}
    <div class="ui-upstream-dashboard__compact-grid" data-testid="compact-grid">
      {#each links as link}{@render compactCard(link)}{/each}
    </div>
  {/if}
{/snippet}

{#snippet rate(fmt: { value: string; unit: string } | null)}
  {#if fmt}<span class="ui-upstream-dashboard__table-rate">{fmt.value}<span class="ui-upstream-dashboard__table-rate-unit">{fmt.unit}</span></span>{:else}<span>—</span>{/if}
{/snippet}

{#snippet tableView()}
  <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions (as React: tabindex, role and handlers are set together, only with a callback) -->
  <div
    class="ui-upstream-dashboard__table-top-metrics"
    data-clickable={onSummaryClick ? '' : undefined}
    tabindex={onSummaryClick ? 0 : undefined}
    role={onSummaryClick ? 'button' : undefined}
    onclick={onSummaryClick}
    onkeydown={onSummaryClick ? activate(onSummaryClick) : undefined}
  >{@render topMetrics()}</div>
  <div class="ui-upstream-dashboard__table-scroll" use:cssProps={reactStyle({ overflowX: 'auto', WebkitOverflowScrolling: 'touch' })}>
    <table class="ui-upstream-dashboard__table" data-testid="table-view">
      <thead>
        <tr>
          <th>Vendor</th>
          <th>Location</th>
          <th>↓ Inbound</th>
          <th>↑ Outbound</th>
          {#if showCapacity}<th>Capacity</th>{/if}
          {#if showBurstCapacity}<th>Burst</th>{/if}
          {#if showUtilization}<th>Util</th>{/if}
          <th>Trend</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {#each tableLinks as link}
          {@const utilPct = link.capacity ? Math.min(100, Math.round(((link.inbound + link.outbound) / link.capacity) * 100)) : null}
          <tr data-status={link.status} data-clickable={onLinkClick ? '' : undefined} onclick={onLinkClick ? () => onLinkClick?.(link) : undefined}>
            <td>{link.vendor}</td>
            <td>{link.location}</td>
            <td>{@render rate(formatBitRateSplit(link.inbound))}</td>
            <td>{@render rate(formatBitRateSplit(link.outbound))}</td>
            {#if showCapacity}<td>{@render rate(link.capacity ? formatBitRateSplit(link.capacity) : null)}</td>{/if}
            {#if showBurstCapacity}<td>{@render rate(link.burstCapacity ? formatBitRateSplit(link.burstCapacity) : null)}</td>{/if}
            {#if showUtilization}
              <td>
                {#if utilPct !== null}
                  <div class="ui-upstream-dashboard__table-util">
                    <div class="ui-upstream-dashboard__table-util-bar"><div class="ui-upstream-dashboard__table-util-fill" use:cssProps={reactStyle({ width: `${utilPct}%`, background: utilColor(utilPct) })}></div></div>
                    <span>{utilPct}%</span>
                  </div>
                {:else}<span>—</span>{/if}
              </td>
            {/if}
            <td>{#if link.trend && link.trend.length >= 2}<span class="ui-upstream-dashboard__table-sparkline">{@render inlineSparkline(link.trend, 60, 20)}</span>{:else}<span>—</span>{/if}</td>
            <td><span class="ui-upstream-dashboard__table-status"><span class="ui-upstream-dashboard__table-status-dot" data-status={link.status} role="status" aria-label={`Status: ${link.status}`}></span></span></td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/snippet}

{#snippet linkCard(link: UpstreamLink)}
  {@const lIn = formatBitRateSplit(link.inbound)}
  {@const lOut = formatBitRateSplit(link.outbound)}
  {@const spark = !compact ? sparklinePaths(link.trend) : null}
  <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions (as React: tabindex, role and handlers are set together, only with a callback) -->
  <div
    class="ui-upstream-dashboard__link"
    data-status={link.status}
    role="group"
    aria-label={`${link.vendor} ${link.location}`}
    data-clickable={onLinkClick ? '' : undefined}
    tabindex={onLinkClick ? 0 : undefined}
    onclick={onLinkClick ? () => onLinkClick?.(link) : undefined}
    onkeydown={onLinkClick ? activate(() => onLinkClick?.(link)) : undefined}
  >
    <div class="ui-upstream-dashboard__link-header">
      <span class="ui-upstream-dashboard__status-dot" role="status" aria-label={`Status: ${link.status}`}></span>
      <h4 class="ui-upstream-dashboard__link-vendor">{link.vendor}</h4>
    </div>
    <span class="ui-upstream-dashboard__link-location">{link.location}</span>
    <div class="ui-upstream-dashboard__link-traffic">
      <div class="ui-upstream-dashboard__link-direction">
        <span class="ui-upstream-dashboard__link-label">{@render inboundArrow()} In</span>
        <span class="ui-upstream-dashboard__link-rate">{lIn.value}<span class="ui-upstream-dashboard__link-unit">{' '}{lIn.unit}</span></span>
      </div>
      <div class="ui-upstream-dashboard__link-direction">
        <span class="ui-upstream-dashboard__link-label">{@render outboundArrow()} Out</span>
        <span class="ui-upstream-dashboard__link-rate">{lOut.value}<span class="ui-upstream-dashboard__link-unit">{' '}{lOut.unit}</span></span>
      </div>
    </div>
    {#if spark}
      <div class="ui-upstream-dashboard__sparkline">
        <svg viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id={`ud-sparkline-${link.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="oklch(65% 0.2 270)" stop-opacity="0.3" />
              <stop offset="100%" stop-color="oklch(65% 0.2 270)" stop-opacity="0" />
            </linearGradient>
          </defs>
          <path d={spark.area} fill={`url(#ud-sparkline-${link.id})`} />
          <path d={spark.line} fill="none" stroke="oklch(65% 0.2 270)" stroke-width="1.5" />
        </svg>
      </div>
    {/if}
  </div>
{/snippet}

<ErrorBoundary>
  <div
    bind:this={ref}
    class={cn('ui-upstream-dashboard', className)}
    data-motion={motionLevel()}
    data-mode={effectiveMode}
    data-compact={compact && !mode ? '' : undefined}
    role="region"
    aria-label={typeof title === 'string' ? title : 'Upstream Dashboard'}
    use:cssProps={styles}
    {...rest}
  >
    {#if title}<h2 class="ui-upstream-dashboard__title"><Content value={title} /></h2>{/if}
    {#if showSummary && !isEmpty}{@render summaryCard()}{/if}
    {#if isEmpty}
      <div class="ui-upstream-dashboard__empty">No upstream links configured</div>
    {:else if effectiveMode === 'hero'}
      {@render heroView()}
    {:else if effectiveMode === 'compact'}
      {@render compactView()}
    {:else if effectiveMode === 'table'}
      {@render tableView()}
    {:else if groups}
      {#each groups as [key, groupLinks] (key)}
        <UpstreamGroup groupKey={key} links={groupLinks} gridClass="ui-upstream-dashboard__grid" card={linkCard} {onGroupClick} />
      {/each}
    {:else}
      <div class="ui-upstream-dashboard__grid">
        {#each links as link}{@render linkCard(link)}{/each}
      </div>
    {/if}
  </div>
</ErrorBoundary>
