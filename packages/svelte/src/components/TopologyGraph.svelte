<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import { cssProps } from '../actions/css-props.js'
  import { mergeStyles, reactStyle, type StyleInput } from '../lib/react-style.js'
  import ErrorBoundary from '../lib/ErrorBoundary.svelte'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'
  import { computeLayout } from '../vendor/core/graph/layout.js'
  import type { LayoutOptions } from '../vendor/core/graph/types.js'
  import type { TopologyNode, TopologyEdge } from '../lib/topology.js'
  import TopologyGraphSVG from './TopologyGraphSVG.svelte'
  import TopologyGraphCanvas from './TopologyGraphCanvas.svelte'

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'style'> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    nodes: TopologyNode[]
    edges: TopologyEdge[]
    layout?: 'force' | 'dagre' | 'circular' | 'grid'
    layoutOptions?: Partial<LayoutOptions>
    onNodeClick?: (node: TopologyNode) => void
    onNodeHover?: (node: TopologyNode | null) => void
    onEdgeClick?: (edge: TopologyEdge) => void
    selectedNodes?: string[]
    showMinimap?: boolean
    showControls?: boolean
    showLegend?: boolean
    height?: number | string
    groupBy?: string
    renderer?: 'auto' | 'svg' | 'canvas'
    nodeFilter?: (node: TopologyNode) => boolean
    edgeFilter?: (edge: TopologyEdge) => boolean
    motion?: MotionLevel
    class?: string
    style?: StyleInput
  }

  let {
    nodes, edges, layout: layoutType = 'force', layoutOptions, onNodeClick, onNodeHover, onEdgeClick, selectedNodes,
    showMinimap = false, showControls = true, showLegend = false, height: heightProp = 500, groupBy: _groupBy,
    renderer = 'auto', nodeFilter, edgeFilter, motion, class: className, style, ref = $bindable(null), ...rest
  }: Props = $props()

  const LEGEND_STATUSES = [
    { status: 'ok', label: 'OK', color: 'oklch(72% 0.19 155)' },
    { status: 'warning', label: 'Warning', color: 'oklch(80% 0.18 85)' },
    { status: 'critical', label: 'Critical', color: 'oklch(62% 0.22 25)' },
    { status: 'unknown', label: 'Unknown', color: 'oklch(55% 0 0)' },
    { status: 'maintenance', label: 'Maintenance', color: 'oklch(65% 0.15 270)' },
  ]

  const motionLevel = getMotionLevel(() => motion)
  const container = $derived(ref)
  let containerWidth = $state(800)
  /* Inherited from React: the zoom buttons update this, but it is never passed
   * to either renderer, so they change nothing visible. Kept, not fixed on one
   * side — each renderer zooms on its own with the wheel. */
  let zoom = $state(1)

  $effect(() => {
    if (!container) return
    const el = container
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) containerWidth = entry.contentRect.width
    })
    ro.observe(el)
    containerWidth = el.clientWidth || 800
    return () => ro.disconnect()
  })

  const graphHeight = $derived(typeof heightProp === 'number' ? heightProp : 500)
  const filteredNodes = $derived(nodeFilter ? nodes.filter(nodeFilter) : nodes)
  const filteredEdges = $derived.by(() => {
    const ids = new Set(filteredNodes.map(n => n.id))
    let result = edges.filter(e => ids.has(e.source) && ids.has(e.target))
    if (edgeFilter) result = result.filter(edgeFilter)
    return result
  })

  const layoutResult = $derived(
    computeLayout(
      filteredNodes.map(n => ({
        id: n.id, x: n.x, y: n.y, width: n.width || 40, height: n.height || 30, data: n,
        ...(n.x != null ? { fx: n.x } : {}),
        ...(n.y != null ? { fy: n.y } : {}),
      })),
      filteredEdges.map(e => ({ source: e.source, target: e.target, data: e })),
      { type: layoutType, width: containerWidth, height: graphHeight, ...layoutOptions },
    ),
  )

  const useCanvas = $derived(renderer === 'canvas' || (renderer === 'auto' && filteredNodes.length > 500))

  // React: style={{ height }} then {...rest}, so a caller's style replaces it whole.
  const styles = $derived(style != null ? mergeStyles(style) : reactStyle({ height: heightProp }))
</script>

<ErrorBoundary>
  <div
    bind:this={ref}
    class={cn('ui-topology-graph', className)}
    data-motion={motionLevel()}
    role="figure"
    aria-label="Network topology graph"
    use:cssProps={styles}
    {...rest}
  >
    {#if showControls}
      <div class="ui-topology-graph__controls" role="toolbar" aria-label="Graph controls">
        <button type="button" class="ui-topology-graph__control-btn" onclick={() => { zoom = Math.min(zoom * 1.2, 5) }} aria-label="Zoom in" data-testid="topology-zoom-in">+</button>
        <button type="button" class="ui-topology-graph__control-btn" onclick={() => { zoom = Math.max(zoom * 0.8, 0.1) }} aria-label="Zoom out" data-testid="topology-zoom-out">&minus;</button>
        <button type="button" class="ui-topology-graph__control-btn" onclick={() => { zoom = 1 }} aria-label="Fit to view" data-testid="topology-fit">&#x2922;</button>
      </div>
    {/if}

    {#if useCanvas}
      <TopologyGraphCanvas layout={layoutResult} nodes={filteredNodes} edges={filteredEdges} {selectedNodes} {onNodeClick} {onNodeHover} {onEdgeClick} motionLevel={motionLevel()} width={containerWidth} height={graphHeight} />
    {:else}
      <TopologyGraphSVG layout={layoutResult} nodes={filteredNodes} edges={filteredEdges} {selectedNodes} {onNodeClick} {onNodeHover} {onEdgeClick} motionLevel={motionLevel()} width={containerWidth} height={graphHeight} />
    {/if}

    {#if showLegend}
      <div class="ui-topology-graph__legend" data-testid="topology-legend">
        {#each LEGEND_STATUSES as s (s.status)}
          <div class="ui-topology-graph__legend-item"><span class="ui-topology-graph__legend-dot" use:cssProps={{ background: s.color }}></span>{s.label}</div>
        {/each}
      </div>
    {/if}

    {#if showMinimap && layoutResult.nodes.length > 0}
      <div class="ui-topology-graph__minimap" data-testid="topology-minimap">
        <svg viewBox={`0 0 ${layoutResult.width || containerWidth} ${layoutResult.height || graphHeight}`}>
          {#each layoutResult.edges as le, i}
            {@const edge = filteredEdges[i]}
            {#if edge && le.points.length >= 2}
              <line x1={le.points[0].x} y1={le.points[0].y} x2={le.points[le.points.length - 1].x} y2={le.points[le.points.length - 1].y} stroke="oklch(55% 0 0)" stroke-width={1} stroke-opacity={0.4} />
            {/if}
          {/each}
          {#each layoutResult.nodes as ln}
            <circle cx={ln.x} cy={ln.y} r={3} fill="oklch(65% 0.15 270)" />
          {/each}
        </svg>
      </div>
    {/if}
  </div>
</ErrorBoundary>
