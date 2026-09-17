<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import Content from '../lib/Content.svelte'
  import ErrorBoundary from '../lib/ErrorBoundary.svelte'
  import { cssProps } from '../actions/css-props.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'
  import DashboardTemplate, { type DashboardMetric, type DashboardSection } from './DashboardTemplate.svelte'
  import { formatMetricValue, deriveStatus } from '../lib/plugin-dashboard-data.js'
  import type { PluginDashboardConfig, DashboardWidget } from '../lib/plugin-dashboard-types.js'

  type Series = Record<string, Array<{ timestamp: number; value: number }>>

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    config: PluginDashboardConfig
    data: Record<string, unknown>
    timeSeries?: Series
    loading?: boolean
    error?: string | Snippet
    onRefresh?: () => void
    autoRefresh?: number
    motion?: MotionLevel
    class?: string
  }

  let { config, data, timeSeries, loading = false, error, onRefresh, autoRefresh, motion, class: className, ref = $bindable(null), ...rest }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)

  const metrics = $derived<DashboardMetric[]>(config.metrics.map(def => {
    const raw = data[def.key]
    const ts = timeSeries?.[def.key]
    return {
      id: def.key,
      title: def.label,
      value: formatMetricValue(raw, def.format, def.unit),
      status: deriveStatus(raw, def.thresholds),
      sparkline: def.sparkline && ts ? ts.map(p => p.value) : undefined,
    }
  }))

  const overallStatus = $derived.by(() => {
    if (!config.statusKey) return undefined
    const def = config.metrics.find(m => m.key === config.statusKey)
    return def ? deriveStatus(data[def.key], def.thresholds) : undefined
  })

  // Chart sections, then the widgets as one full-width section — all rendered by `sectionContent`.
  const sections = $derived<DashboardSection[]>([
    ...config.charts.map(chart => ({ id: chart.id, title: chart.title, content: sectionContent })),
    ...(config.widgets && config.widgets.length > 0 ? [{ id: '__widgets__', title: 'Widgets', span: 3 as const, content: sectionContent }] : []),
  ])

  const statusClassOf = (v: string) =>
    ['ok', 'healthy', 'green', 'running', 'active'].includes(v) ? 'ok'
      : ['warning', 'degraded', 'yellow'].includes(v) ? 'warning'
      : ['critical', 'error', 'red', 'down'].includes(v) ? 'critical'
      : 'unknown'

  function sparkPoints(ts: Array<{ value: number }>) {
    const values = ts.map(d => d.value)
    const max = Math.max(...values)
    const min = Math.min(...values)
    const range = max - min || 1
    return ts.map((p, i) => `${i},${20 - ((p.value - min) / range) * 18}`).join(' ')
  }

  const EMPTY_NOTE = { color: 'var(--text-tertiary)', 'font-size': 'var(--text-sm)' }
</script>

{#snippet sectionContent(section: DashboardSection)}
  {#if section.id === '__widgets__' && config.widgets}
    <div class={`ui-plugin-dashboard__widget-grid${config.layout === '2-col' ? ' ui-plugin-dashboard__widget-grid--2-col' : config.layout === '3-col' ? ' ui-plugin-dashboard__widget-grid--3-col' : ''}`} role="region" aria-label="Dashboard widgets">
      {#each config.widgets as widget (widget.id)}
        <div class={cn('ui-plugin-dashboard__widget', widget.span === 2 && 'ui-plugin-dashboard__widget--span-2', widget.span === 3 && 'ui-plugin-dashboard__widget--span-3')}
          use:cssProps={widget.height ? { 'min-block-size': typeof widget.height === 'number' ? `${widget.height}px` : widget.height } : {}}>
          <h4 class="ui-plugin-dashboard__widget-title">{widget.title}</h4>
          {@render widgetContent(widget)}
        </div>
      {/each}
    </div>
  {:else}
    {@const chart = config.charts.find(c => c.id === section.id)}
    {#if chart}<div class="ui-plugin-dashboard__chart-placeholder" use:cssProps={{ 'min-block-size': `${chart.height ?? 120}px` }}>{chart.series.map(s => s.label).join(', ')} chart</div>{/if}
  {/if}
{/snippet}

{#snippet widgetContent(widget: DashboardWidget)}
  {#if widget.type === 'metric'}
    {@const raw = widget.metricKey ? data[widget.metricKey] : undefined}
    {@const status = deriveStatus(raw, widget.metricThresholds)}
    {@const ts = widget.metricSparkline && widget.metricKey ? timeSeries?.[widget.metricKey] : undefined}
    {@const trend = widget.metricTrend && ts && ts.length >= 2 ? (ts[ts.length - 1].value >= ts[ts.length - 2].value ? 'up' : 'down') : undefined}
    <div class="ui-plugin-dashboard__widget-metric-row">
      <span class="ui-plugin-dashboard__widget-metric-value">{#if status}<span class={`ui-plugin-dashboard__widget-status-indicator ui-plugin-dashboard__widget-status-indicator--${status}`}></span>{/if}{formatMetricValue(raw, widget.metricFormat, widget.metricUnit)}</span>
      {#if trend}<span class={`ui-plugin-dashboard__widget-trend ui-plugin-dashboard__widget-trend--${trend}`}>{trend === 'up' ? '↑' : '↓'}</span>{/if}
    </div>
    {#if widget.metricSparkline && ts}
      <svg viewBox={`0 0 ${ts.length - 1} 20`} preserveAspectRatio="none" width="100%" height="24" aria-hidden="true" use:cssProps={{ display: 'block' }}><polyline fill="none" stroke="oklch(65% 0.2 270)" stroke-width="1.5" points={sparkPoints(ts)} /></svg>
    {/if}
  {:else if widget.type === 'chart'}
    {@const series = widget.chartSeries ?? []}
    <div class="ui-plugin-dashboard__chart-placeholder" use:cssProps={{ 'min-block-size': `${widget.chartHeight ?? 120}px` }}>{#each series as s, i (s.key)}<span use:cssProps={{ color: s.color ?? 'oklch(65% 0.2 270)', 'margin-inline-end': i < series.length - 1 ? '0.75rem' : '0' }}>{s.label}</span>{/each}{series.length > 0 ? ` (${widget.chartType ?? 'line'})` : ''}</div>
  {:else if widget.type === 'gauge'}
    {@const value = Number(widget.gaugeKey ? data[widget.gaugeKey] : 0) || 0}
    {@const pct = Math.min(Math.max(value / (widget.gaugeMax ?? 100), 0), 1)}
    {@const circumference = Math.PI * 40}
    {@const gaugeStatus = widget.gaugeThresholds ? deriveStatus(value, widget.gaugeThresholds) : undefined}
    <div class="ui-plugin-dashboard__gauge-wrap">
      <svg viewBox="0 0 100 60" width="120" height="72" aria-hidden="true">
        <path class="ui-plugin-dashboard__gauge-track" d="M 10 50 A 40 40 0 0 1 90 50" stroke-width={8} />
        <path class="ui-plugin-dashboard__gauge-fill" d="M 10 50 A 40 40 0 0 1 90 50" stroke-width={8}
          stroke={gaugeStatus === 'warning' ? 'oklch(80% 0.18 85)' : gaugeStatus === 'critical' ? 'oklch(62% 0.22 25)' : 'oklch(72% 0.19 155)'}
          stroke-dasharray={circumference} stroke-dashoffset={circumference * (1 - pct)} />
        <text x="50" y="45" class="ui-plugin-dashboard__gauge-label">{Math.round(pct * 100)}%</text>
      </svg>
    </div>
  {:else if widget.type === 'table'}
    {@const columns = widget.tableColumns ?? []}
    {@const rows = (widget.tableDataKey ? data[widget.tableDataKey] : []) as Array<Record<string, unknown>>}
    {#if !Array.isArray(rows) || rows.length === 0}
      <span use:cssProps={EMPTY_NOTE}>No data</span>
    {:else}
      <table class="ui-plugin-dashboard__widget-table">
        <thead><tr>{#each columns as col (col.key)}<th>{col.label}</th>{/each}</tr></thead>
        <tbody>{#each rows.slice(0, 10) as row}<tr>{#each columns as col (col.key)}<td>{formatMetricValue(row[col.key], col.format)}</td>{/each}</tr>{/each}</tbody>
      </table>
    {/if}
  {:else if widget.type === 'status'}
    {@const str = String((widget.statusKey ? data[widget.statusKey] : undefined) ?? 'unknown')}
    {@const cls = statusClassOf(str)}
    <span class={`ui-plugin-dashboard__widget-status-badge ui-plugin-dashboard__widget-status-badge--${cls}`}><span class={`ui-plugin-dashboard__widget-status-indicator ui-plugin-dashboard__widget-status-indicator--${cls}`}></span>{widget.statusLabels?.[str] ?? str}</span>
  {:else if widget.type === 'list'}
    {@const items = (widget.listKey ? data[widget.listKey] : []) as unknown[]}
    {#if !Array.isArray(items) || items.length === 0}
      <span use:cssProps={EMPTY_NOTE}>No items</span>
    {:else}
      <ul class="ui-plugin-dashboard__widget-list">
        {#each items.slice(0, 20) as item}
          <li class="ui-plugin-dashboard__widget-list-item">{#if (widget.listItemFormat ?? 'text') === 'badge'}<span class="ui-plugin-dashboard__widget-list-badge">{String(item)}</span>{:else if widget.listItemFormat === 'link'}<a class="ui-plugin-dashboard__widget-list-link" href={String(item)} target="_blank" rel="noopener noreferrer">{String(item)}</a>{:else}{String(item)}{/if}</li>
        {/each}
      </ul>
    {/if}
  {:else if widget.type === 'custom' && widget.render}
    {@render widget.render(data)}
  {/if}
{/snippet}

{#snippet sidebar()}
  <div class="ui-plugin-dashboard__properties" role="list" aria-label="Properties">
    {#each config.properties as prop (prop.key)}
      {@const value = data[prop.key]}
      <div class="ui-plugin-dashboard__prop" role="listitem">
        <span class="ui-plugin-dashboard__prop-label">{prop.label}</span>
        <span class="ui-plugin-dashboard__prop-value">
          {#if value == null}—{:else if prop.format === 'code'}<code class="ui-plugin-dashboard__prop-code">{String(value)}</code>{:else if prop.format === 'link'}<a class="ui-plugin-dashboard__prop-link" href={String(value)} target="_blank" rel="noopener noreferrer">{String(value)}</a>{:else if prop.format === 'badge'}<span class="ui-plugin-dashboard__prop-badge">{String(value)}</span>{:else if prop.format === 'timestamp'}{new Date(typeof value === 'number' ? value : String(value)).toLocaleString()}{:else if prop.format === 'duration'}{formatMetricValue(value, 'duration')}{:else}{String(value)}{/if}{#if prop.copyable && value != null}<button type="button" class="ui-plugin-dashboard__prop-copy" onclick={() => navigator.clipboard?.writeText(String(value))} aria-label={`Copy ${String(value)}`}>copy</button>{/if}
        </span>
      </div>
    {/each}
  </div>
{/snippet}

<ErrorBoundary>
  <div class={cn('ui-plugin-dashboard', className)} data-motion={motionLevel()} bind:this={ref} {...rest}>
    {#if error}
      <DashboardTemplate title={config.name} status="unknown">
        <div class="ui-plugin-dashboard__error" role="alert"><Content value={error} /></div>
      </DashboardTemplate>
    {:else}
      {#if loading}<div class="ui-plugin-dashboard__loading-overlay" role="status" aria-label="Loading"><div class="ui-plugin-dashboard__loading-spinner"></div></div>{/if}
      <DashboardTemplate title={config.name} status={overallStatus} {metrics} {sections} sidebar={config.properties.length === 0 ? undefined : sidebar} {onRefresh} {autoRefresh} {motion} />
    {/if}
  </div>
</ErrorBoundary>
