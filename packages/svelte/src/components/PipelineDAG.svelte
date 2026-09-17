<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import ErrorBoundary from '../lib/ErrorBoundary.svelte'
  import { cssProps } from '../actions/css-props.js'
  import { reactStyle } from '../lib/react-style.js'
  import { computeLayout } from '../vendor/core/graph/layout.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  export interface PipelineNode {
    id: string
    label: string
    type?: 'source' | 'transform' | 'sink' | 'filter' | 'aggregate' | 'custom'
    status?: 'pending' | 'running' | 'success' | 'failed' | 'skipped'
    metrics?: { throughput?: number; latency?: number; errorRate?: number; dropped?: number }
    /** Accepted for API parity; React's DAG does not render it. */
    icon?: string | Snippet
  }
  export interface PipelineEdge {
    source: string
    target: string
    label?: string
    throughput?: number
    animated?: boolean
  }

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    nodes: PipelineNode[]
    edges: PipelineEdge[]
    direction?: 'LR' | 'TB'
    onNodeClick?: (node: PipelineNode) => void
    onEdgeClick?: (edge: PipelineEdge) => void
    selectedNode?: string
    showMetrics?: boolean
    showThroughput?: boolean
    height?: number | string
    motion?: MotionLevel
    class?: string
  }

  const NODE_WIDTH = 160, NODE_HEIGHT = 56, NODE_HEIGHT_METRICS = 76, PADDING = 40
  const STATUS_COLORS: Record<string, string> = { pending: 'oklch(70% 0 0)', running: 'oklch(65% 0.2 270)', success: 'oklch(72% 0.19 155)', failed: 'oklch(62% 0.22 25)', skipped: 'oklch(55% 0 0)' }
  const STATUS_BG: Record<string, string> = { pending: 'oklch(70% 0 0 / 0.08)', running: 'oklch(65% 0.2 270 / 0.08)', success: 'oklch(72% 0.19 155 / 0.08)', failed: 'oklch(62% 0.22 25 / 0.08)', skipped: 'oklch(55% 0 0 / 0.06)' }
  const TYPE_LABELS: Record<string, string> = { source: 'Source', transform: 'Transform', sink: 'Sink', filter: 'Filter', aggregate: 'Aggregate', custom: 'Custom' }
  const rate = (n: number) => (n >= 1000000 ? `${(n / 1000000).toFixed(1)}M/s` : n >= 1000 ? `${(n / 1000).toFixed(1)}K/s` : `${n}/s`)

  let {
    nodes, edges, direction = 'LR', onNodeClick, onEdgeClick, selectedNode, showMetrics = false, showThroughput = false,
    height = 300, motion, class: className, ref = $bindable(null), ...rest
  }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)
  const nodeMap = $derived(new Map(nodes.map(n => [n.id, n])))
  const nodeH = $derived(showMetrics ? NODE_HEIGHT_METRICS : NODE_HEIGHT)
  const svgStyle = $derived(reactStyle({ height: typeof height === 'number' ? `${height}px` : height }))

  const layout = $derived.by(() => {
    if (nodes.length === 0) return null
    const layers = Math.ceil(nodes.length / 2)
    const w = direction === 'LR' ? Math.max(600, layers * (NODE_WIDTH + 80) + PADDING * 2) : Math.max(400, 3 * (NODE_WIDTH + 60) + PADDING * 2)
    const h = direction === 'TB' ? Math.max(400, layers * (nodeH + 60) + PADDING * 2) : Math.max(300, 3 * (nodeH + 40) + PADDING * 2)
    return computeLayout(
      nodes.map(n => ({ id: n.id, width: NODE_WIDTH, height: nodeH })),
      edges.map(e => ({ source: e.source, target: e.target })),
      { type: 'dagre', rankDir: direction, width: w, height: h, rankSep: 80, nodeSep: 40 },
    )
  })

  // Fit the viewBox to the laid-out nodes, with padding.
  const viewBox = $derived.by(() => {
    if (!layout) return ''
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const n of layout.nodes) {
      const nw = (n.width || NODE_WIDTH) / 2, nh = (n.height || nodeH) / 2
      minX = Math.min(minX, n.x - nw); minY = Math.min(minY, n.y - nh)
      maxX = Math.max(maxX, n.x + nw); maxY = Math.max(maxY, n.y + nh)
    }
    if (!isFinite(minX)) { minX = 0; minY = 0; maxX = layout.width; maxY = layout.height }
    return `${minX - 40} ${minY - 40} ${maxX - minX + 80} ${maxY - minY + 80}`
  })
  const maxThroughput = $derived(edges.reduce((m, e) => Math.max(m, e.throughput ?? 0), 1))

  function bezier(pts: { x: number; y: number }[]): string {
    if (pts.length < 2) return ''
    const s = pts[0], e = pts[pts.length - 1]
    if (direction === 'LR') { const dx = (e.x - s.x) * 0.4; return `M ${s.x} ${s.y} C ${s.x + dx} ${s.y}, ${e.x - dx} ${e.y}, ${e.x} ${e.y}` }
    const dy = (e.y - s.y) * 0.4
    return `M ${s.x} ${s.y} C ${s.x} ${s.y + dy}, ${e.x} ${e.y - dy}, ${e.x} ${e.y}`
  }
  const mid = (pts: { x: number; y: number }[]) => (pts.length < 2 ? { x: 0, y: 0 } : { x: (pts[0].x + pts[pts.length - 1].x) / 2, y: (pts[0].y + pts[pts.length - 1].y) / 2 })
  const animated = (e: PipelineEdge) => e.animated ?? (nodeMap.get(e.source)?.status === 'running' || nodeMap.get(e.target)?.status === 'running')
  const cx = (...parts: (string | false | undefined | null)[]) => parts.filter(Boolean).join(' ')
  const metricText = (m: NonNullable<PipelineNode['metrics']>) =>
    (m.throughput != null ? rate(m.throughput) : '') + (m.latency != null ? ` ${m.latency}ms` : '') + (m.errorRate != null ? ` ${m.errorRate}% err` : '') + (m.dropped != null ? ` -${m.dropped}` : '')
</script>

<ErrorBoundary>
  {#if !layout}
    <div class={cn('ui-pipeline-dag', className)} data-motion={motionLevel()} role="img" aria-label="Empty pipeline DAG" bind:this={ref} {...rest}>
      <svg class="ui-pipeline-dag__svg" viewBox="0 0 400 100" use:cssProps={svgStyle}>
        <text x="200" y="50" text-anchor="middle" fill="var(--text-tertiary, oklch(55% 0 0))" font-size="13">No pipeline data</text>
      </svg>
    </div>
  {:else}
    <div class={cn('ui-pipeline-dag', className)} data-motion={motionLevel()} role={onNodeClick || onEdgeClick ? 'figure' : 'img'} aria-label={`Pipeline DAG with ${nodes.length} nodes and ${edges.length} edges`} bind:this={ref} {...rest}>
      <svg class="ui-pipeline-dag__svg" {viewBox} use:cssProps={svgStyle} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <marker id="ui-dag-arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 Z" fill="oklch(70% 0 0 / 0.5)" />
          </marker>
        </defs>
        <g class="ui-pipeline-dag__edges">
          {#each layout.edges as le, i (i)}
            {@const edge = edges[i]}
            {#if edge}
              {@const d = bezier(le.points)}
              {@const m = mid(le.points)}
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <!-- svelte-ignore a11y_no_static_element_interactions -->
              <g class={cn('ui-pipeline-dag__edge', onEdgeClick && 'ui-pipeline-dag__edge--clickable')} onclick={onEdgeClick ? () => onEdgeClick(edge) : undefined}>
                {#if onEdgeClick}<path class="ui-pipeline-dag__edge-hit" {d} />{/if}
                <path
                  class={cn('ui-pipeline-dag__edge-path', animated(edge) && 'ui-pipeline-dag__edge-path--animated')}
                  {d}
                  stroke-width={showThroughput && edge.throughput ? 1.5 + (edge.throughput / maxThroughput) * 3 : 1.5}
                  marker-end="url(#ui-dag-arrow)"
                />
                {#if edge.label}<text class="ui-pipeline-dag__edge-label" x={m.x} y={m.y - 8}>{edge.label}</text>{/if}
                {#if showThroughput && edge.throughput != null}<text class="ui-pipeline-dag__edge-label" x={m.x} y={m.y + 10}>{rate(edge.throughput)}</text>{/if}
              </g>
            {/if}
          {/each}
        </g>
        <g class="ui-pipeline-dag__nodes">
          {#each layout.nodes as ln (ln.id)}
            {@const node = nodeMap.get(ln.id)}
            {#if node}
              {@const status = node.status ?? 'pending'}
              {@const color = STATUS_COLORS[status] ?? STATUS_COLORS.pending}
              {@const x = ln.x - NODE_WIDTH / 2}
              {@const y = ln.y - nodeH / 2}
              <!-- role="button" and tabindex are set together, from onNodeClick. -->
              <!-- svelte-ignore a11y_no_static_element_interactions, a11y_no_noninteractive_tabindex -->
              <g
                class={cx('ui-pipeline-dag__node', onNodeClick && 'ui-pipeline-dag__node--clickable', selectedNode === node.id && 'ui-pipeline-dag__node--selected', status === 'running' && 'ui-pipeline-dag__node--running')}
                data-status={status}
                data-node-id={node.id}
                onclick={onNodeClick ? () => onNodeClick(node) : undefined}
                tabindex={onNodeClick ? 0 : undefined}
                role={onNodeClick ? 'button' : undefined}
                aria-label={onNodeClick ? `${node.label}: ${status}` : undefined}
                onkeydown={onNodeClick ? e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNodeClick(node) } } : undefined}
              >
                <rect class="ui-pipeline-dag__node-bg" {x} {y} width={NODE_WIDTH} height={nodeH} fill={STATUS_BG[status] ?? STATUS_BG.pending} />
                <rect class="ui-pipeline-dag__node-accent" {x} {y} width={4} height={nodeH} fill={color} rx={2} />
                <text class="ui-pipeline-dag__node-label" x={x + 14} y={y + 18}>{node.label}</text>
                {#if node.type}<text class="ui-pipeline-dag__node-type" x={x + 14} y={y + 34} fill={color}>{TYPE_LABELS[node.type] ?? node.type}</text>{/if}
                {#if showMetrics && node.metrics}<text class="ui-pipeline-dag__node-metric" x={x + 14} y={y + 52}>{metricText(node.metrics)}</text>{/if}
              </g>
            {/if}
          {/each}
        </g>
      </svg>
    </div>
  {/if}
</ErrorBoundary>
