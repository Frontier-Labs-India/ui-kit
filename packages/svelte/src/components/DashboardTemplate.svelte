<script module lang="ts">
  import type { Snippet } from 'svelte'

  export interface DashboardMetric {
    id: string
    title: string
    value: string | number | Snippet
    change?: { value: number; period?: string }
    trend?: 'up' | 'down' | 'flat'
    status?: 'ok' | 'warning' | 'critical'
    sparkline?: number[]
    icon?: string | Snippet
  }

  export interface DashboardSection {
    id: string
    title: string
    description?: string
    collapsible?: boolean
    defaultCollapsed?: boolean
    /** A string, or a snippet — rendered with this section as its argument, so one snippet can serve many sections. */
    content: string | Snippet | Snippet<[DashboardSection]>
    span?: 1 | 2 | 3
  }
</script>

<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { SvelteMap } from 'svelte/reactivity'
  import { cn } from '../lib/cls.js'
  import Content from '../lib/Content.svelte'
  import ErrorBoundary from '../lib/ErrorBoundary.svelte'
  import { cssProps } from '../actions/css-props.js'
  import { mergeStyles, type StyleInput } from '../lib/react-style.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'style'> {
    title?: string | Snippet
    subtitle?: string
    status?: 'ok' | 'warning' | 'critical' | 'unknown' | 'maintenance'
    metrics?: DashboardMetric[]
    sections?: DashboardSection[]
    columns?: 1 | 2 | 3
    sidebar?: string | Snippet
    sidebarPosition?: 'left' | 'right'
    sidebarCollapsible?: boolean
    actions?: string | Snippet
    /** Milliseconds between onRefresh calls. */
    autoRefresh?: number
    onRefresh?: () => void
    lastUpdated?: number | Date
    headerHeight?: number | string
    metricsScrollable?: boolean
    sidebarWidth?: number | string
    variant?: 'default' | 'compact' | 'fullscreen'
    showBreadcrumb?: string | Snippet
    showStatusBar?: boolean
    statusBarContent?: string | Snippet
    onSectionToggle?: (sectionId: string, collapsed: boolean) => void
    stickyHeader?: boolean
    metricsLayout?: 'row' | 'grid'
    onMetricClick?: (metric: DashboardMetric) => void
    children?: Snippet
    motion?: MotionLevel
    class?: string
    style?: StyleInput
  }

  let {
    title, subtitle, status, lastUpdated, metrics, sections, columns = 2, sidebar, sidebarPosition = 'right',
    sidebarCollapsible = false, actions, autoRefresh, onRefresh, headerHeight, metricsScrollable = true, sidebarWidth,
    variant = 'default', showBreadcrumb, showStatusBar = false, statusBarContent, onSectionToggle, stickyHeader = false,
    metricsLayout = 'row', onMetricClick, children, motion, class: className, style, ...rest
  }: Props = $props()

  function formatRelativeTime(timestamp: number | Date) {
    const ms = typeof timestamp === 'number' ? timestamp : timestamp.getTime()
    const diff = Math.max(0, Math.floor((Date.now() - ms) / 1000))
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }
  const px = (v: number | string) => (typeof v === 'number' ? `${v}px` : v)
  const STATUS_TEXT: Record<string, string> = { ok: 'All systems operational', warning: 'Some systems degraded', critical: 'System outage detected', maintenance: 'Scheduled maintenance' }

  const motionLevel = getMotionLevel(() => motion)
  let sidebarCollapsed = $state(false)
  // Per-section collapse, keyed by id as React's keyed SectionCard state is.
  const collapsedById = new SvelteMap<string, boolean>()
  const isCollapsed = (s: DashboardSection) => collapsedById.get(s.id) ?? s.defaultCollapsed ?? false

  $effect(() => {
    if (!autoRefresh || !onRefresh) return
    const id = setInterval(onRefresh, autoRefresh)
    return () => clearInterval(id)
  })

  function toggleSection(s: DashboardSection) {
    const next = !isCollapsed(s)
    collapsedById.set(s.id, next)
    onSectionToggle?.(s.id, next)
  }

  const sidebarLayout = $derived(sidebar ? (sidebarCollapsed ? 'none' : sidebarPosition) : 'none')
  const rootStyles = $derived(mergeStyles(style, sidebarWidth ? { '--dt-sidebar-w': px(sidebarWidth) } : null))
  const sparkPoints = (data: number[]) => {
    const min = Math.min(...data)
    const range = Math.max(...data) - min || 1
    const step = 48 / (data.length - 1)
    return data.map((v, i) => `${i * step},${24 - ((v - min) / range) * 24}`).join(' ')
  }
</script>

{#snippet chevron()}<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M3 5l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>{/snippet}

{#snippet aside()}
  <aside class="ui-dashboard-template__sidebar" data-collapsed={sidebarCollapsed ? '' : undefined}>
    {#if sidebarCollapsible}
      <button type="button" class="ui-dashboard-template__sidebar-toggle" onclick={() => { sidebarCollapsed = !sidebarCollapsed }} aria-expanded={!sidebarCollapsed} aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>{@render chevron()}</button>
    {/if}
    {#if !sidebarCollapsed}<Content value={sidebar} />{/if}
  </aside>
{/snippet}

<ErrorBoundary>
  <div
    class={cn('ui-dashboard-template', className)}
    data-motion={motionLevel()}
    data-columns={columns}
    data-variant={variant !== 'default' ? variant : undefined}
    data-sticky-header={stickyHeader ? '' : undefined}
    role="group"
    aria-label={typeof title === 'string' ? `Dashboard: ${title}` : 'Dashboard'}
    use:cssProps={rootStyles}
    {...rest}
  >
    {#if title || status || lastUpdated || actions || showBreadcrumb}
      <div class="ui-dashboard-template__header" use:cssProps={headerHeight ? { 'min-block-size': px(headerHeight) } : {}}>
        <div class="ui-dashboard-template__title-group">
          {#if showBreadcrumb}<div class="ui-dashboard-template__breadcrumb"><Content value={showBreadcrumb} /></div>{/if}
          {#if title}<h2 class="ui-dashboard-template__title"><Content value={title} /></h2>{/if}
          {#if subtitle}<p class="ui-dashboard-template__subtitle">{subtitle}</p>{/if}
        </div>
        {#if status}<span class="ui-dashboard-template__status-badge" data-status={status}><span class="ui-dashboard-template__status-dot"></span>{status}</span>{/if}
        <!-- JSX renders `0 && …` as "0": lastUpdated or autoRefresh of 0 shows a stray 0, as in React. -->
        <div class="ui-dashboard-template__header-meta">{#if lastUpdated}<span class="ui-dashboard-template__last-updated">Updated {formatRelativeTime(lastUpdated)}</span>{:else if lastUpdated === 0}0{/if}{#if autoRefresh && onRefresh}<span class="ui-dashboard-template__refresh-indicator"><span class="ui-dashboard-template__refresh-dot"></span></span>{:else if autoRefresh === 0}0{/if}</div>
        {#if actions}<div class="ui-dashboard-template__actions"><Content value={actions} /></div>{/if}
      </div>
    {/if}
    {#if showStatusBar}
      <div class="ui-dashboard-template__status-bar" role="status">{#if statusBarContent !== undefined && statusBarContent !== null}<Content value={statusBarContent} />{:else}<span>{STATUS_TEXT[status ?? ''] ?? 'Status unknown'}</span>{/if}</div>
    {/if}
    {#if metrics && metrics.length > 0}
      <div class="ui-dashboard-template__metrics" role="list" aria-label="Key metrics" data-layout={metricsLayout} data-scrollable={metricsScrollable && metricsLayout === 'row' ? '' : undefined}>
        {#each metrics as metric (metric.id)}
          {@const clickable = !!onMetricClick}
          <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_static_element_interactions -->
          <div
            class="ui-dashboard-template__metric"
            data-status={metric.status}
            data-clickable={clickable ? '' : undefined}
            role={clickable ? 'button' : 'listitem'}
            tabindex={clickable ? 0 : undefined}
            onclick={clickable ? () => onMetricClick?.(metric) : undefined}
            onkeydown={clickable ? (e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onMetricClick?.(metric) } }) : undefined}
            aria-label={clickable ? `${metric.title}: ${typeof metric.value === 'string' ? metric.value : ''}` : undefined}
          >
            <div class="ui-dashboard-template__metric-header">
              {#if metric.icon}<span class="ui-dashboard-template__metric-icon"><Content value={metric.icon} /></span>{/if}
              <span class="ui-dashboard-template__metric-title">{metric.title}</span>
            </div>
            <span class="ui-dashboard-template__metric-value"><Content value={metric.value} /></span>
            <div class="ui-dashboard-template__metric-footer">
              {#if metric.trend && metric.change}
                <span class="ui-dashboard-template__metric-change" data-trend={metric.trend}>
                  {#if metric.trend === 'flat'}<span aria-hidden="true">&ndash;</span>{:else}<svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">{#if metric.trend === 'up'}<path d="M5 2L8 6H2L5 2Z" fill="currentColor" />{:else}<path d="M5 8L2 4H8L5 8Z" fill="currentColor" />{/if}</svg>{/if}{Math.abs(metric.change.value)}%
                </span>
              {/if}
              {#if metric.change?.period}<span class="ui-dashboard-template__metric-period">{metric.change.period}</span>{/if}
              {#if metric.sparkline && metric.sparkline.length >= 2}
                <svg class="ui-dashboard-template__metric-sparkline" width={48} height={24} viewBox="0 0 48 24" fill="none" aria-hidden="true"><polyline points={sparkPoints(metric.sparkline)} stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.5" /></svg>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}
    {#if sections || sidebar || children}
      <div class="ui-dashboard-template__body" data-sidebar={sidebarLayout}
        use:cssProps={sidebarWidth && !sidebarCollapsed && sidebar ? { 'grid-template-columns': sidebarPosition === 'left' ? 'var(--dt-sidebar-w, 280px) 1fr' : '1fr var(--dt-sidebar-w, 280px)' } : {}}>
        {#if sidebar && sidebarPosition === 'left'}{@render aside()}{/if}
        <div class="ui-dashboard-template__main">
          {#each sections ?? [] as section (section.id)}
            {@const collapsed = isCollapsed(section)}
            <section class="ui-dashboard-template__section" use:cssProps={section.span && section.span > 1 ? { 'grid-column': `span ${section.span}` } : {}} data-span={section.span}>
              <div class="ui-dashboard-template__section-header">
                {#if section.collapsible}
                  <button type="button" class="ui-dashboard-template__section-toggle" onclick={() => toggleSection(section)} aria-expanded={!collapsed} aria-label={collapsed ? `Expand ${section.title}` : `Collapse ${section.title}`}>{@render chevron()}</button>
                {/if}
                <h3 class="ui-dashboard-template__section-title">{section.title}</h3>
                {#if section.description}<p class="ui-dashboard-template__section-desc">{section.description}</p>{/if}
              </div>
              <div class="ui-dashboard-template__section-content" data-collapsed={collapsed ? '' : undefined}>{#if typeof section.content === 'function'}{@render (section.content as Snippet<[DashboardSection]>)(section)}{:else}{section.content}{/if}</div>
            </section>
          {/each}
          {#if children}{@render children()}{/if}
        </div>
        {#if sidebar && sidebarPosition === 'right'}{@render aside()}{/if}
      </div>
    {/if}
  </div>
</ErrorBoundary>
