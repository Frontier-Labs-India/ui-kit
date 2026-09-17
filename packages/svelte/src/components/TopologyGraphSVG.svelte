<script lang="ts">
  import Content from '../lib/Content.svelte'
  import { cssProps } from '../actions/css-props.js'
  import type { TopologyRendererProps } from '../lib/topology.js'

  let {
    layout, nodes, edges, selectedNodes = [], onNodeClick, onNodeHover, onEdgeClick, motionLevel, width, height, ref = $bindable(null),
  }: TopologyRendererProps & {
    /** The <svg> element (React's renderer takes no ref). Read it with `bind:ref`. */
    ref?: SVGSVGElement | null
  } = $props()

  const STATUS_COLORS: Record<string, string> = {
    ok: 'oklch(72% 0.19 155)',
    warning: 'oklch(80% 0.18 85)',
    critical: 'oklch(62% 0.22 25)',
    unknown: 'oklch(55% 0 0)',
    maintenance: 'oklch(65% 0.15 270)',
  }
  const statusColor = (status?: string) => STATUS_COLORS[status || 'unknown'] || STATUS_COLORS.unknown

  /* React renders this text inside an inline <style>, which style-src 'self'
   * blocks in both packages. Kept for the DOM contract; allowed by name in
   * INHERITED_INLINE_STYLE (scripts/check-svelte-csp.js) with its reason. */
  const KEYFRAMES = `
            @keyframes ui-topo-dash {
              to { stroke-dashoffset: -20; }
            }
          `

  function edgePath(points: Array<{ x: number; y: number }>): string {
    if (points.length < 2) return ''
    const [start, end] = [points[0], points[points.length - 1]]
    const midX = (start.x + end.x) / 2
    const midY = (start.y + end.y) / 2
    const dx = end.x - start.x
    const dy = end.y - start.y
    const offset = Math.min(Math.abs(dx) + Math.abs(dy), 40) * 0.15
    const cx = midX - dy * offset / (Math.abs(dy) + 1)
    const cy = midY + dx * offset / (Math.abs(dx) + 1)
    return `M${start.x},${start.y} Q${cx},${cy} ${end.x},${end.y}`
  }

  function midpoint(points: Array<{ x: number; y: number }>) {
    if (points.length < 2) return { x: 0, y: 0 }
    return { x: (points[0].x + points[points.length - 1].x) / 2, y: (points[0].y + points[points.length - 1].y) / 2 }
  }

  let pan = $state({ x: 0, y: 0 })
  let zoom = $state(1)
  let dragging = $state(false)
  let dragStart = { x: 0, y: 0, panX: 0, panY: 0 }

  const nodeMap = $derived(new Map(nodes.map(n => [n.id, n])))
  const selectedSet = $derived(new Set(selectedNodes))
  const nodeW = 40
  const nodeH = 30

  function handleMouseDown(e: MouseEvent) {
    const target = e.target as Element
    if (target.closest('.ui-topology-graph__node')) return
    if (target.closest('.ui-topology-graph__edge')) return
    dragging = true
    dragStart = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y }
  }

  function handleMouseMove(e: MouseEvent) {
    if (!dragging) return
    pan = { x: dragStart.panX + e.clientX - dragStart.x, y: dragStart.panY + e.clientY - dragStart.y }
  }

  function handleWheel(e: WheelEvent) {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    zoom = Math.min(Math.max(zoom * delta, 0.1), 5)
  }

  $effect(() => {
    const up = () => { dragging = false }
    window.addEventListener('mouseup', up)
    return () => window.removeEventListener('mouseup', up)
  })
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<svg
  bind:this={ref}
  {width}
  {height}
  viewBox={`0 0 ${width} ${height}`}
  class="ui-topology-graph__svg"
  onmousedown={handleMouseDown}
  onmousemove={handleMouseMove}
  onmouseup={() => { dragging = false }}
  onwheel={handleWheel}
  use:cssProps={{ cursor: dragging ? 'grabbing' : 'grab' }}
  data-testid="topology-svg"
>
  <defs>
    <marker id="ui-topo-arrow" viewBox="0 0 10 6" refX="10" refY="3" markerWidth="8" markerHeight="6" orient="auto-start-reverse">
      <path d="M0,0 L10,3 L0,6 Z" fill="oklch(55% 0 0)" />
    </marker>
    {#if motionLevel >= 2}<svelte:element this={"style"}>{KEYFRAMES}</svelte:element>{/if}
  </defs>

  <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
    {#each layout.edges as le, i}
      {@const edge = edges[i]}
      {#if edge}
        {@const path = edgePath(le.points)}
        {@const color = statusColor(edge.status)}
        {@const mid = midpoint(le.points)}
        <g class="ui-topology-graph__edge">
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <path
            d={path}
            fill="none"
            stroke={color}
            stroke-width={edge.bandwidth ? Math.min(edge.bandwidth / 100, 4) + 1 : 1.5}
            stroke-opacity={0.7}
            marker-end="url(#ui-topo-arrow)"
            use:cssProps={edge.animated && motionLevel >= 2 ? { 'stroke-dasharray': '6 4', animation: 'ui-topo-dash 0.8s linear infinite' } : {}}
            cursor={onEdgeClick ? 'pointer' : undefined}
            onclick={onEdgeClick ? () => onEdgeClick(edge) : undefined}
          />
          {#if edge.bidirectional}<path d={path} fill="none" stroke="none" marker-start="url(#ui-topo-arrow)" />{/if}
          {#if edge.label}
            <text x={mid.x} y={mid.y - 6} text-anchor="middle" font-size={9} fill="oklch(70% 0 0)" class="ui-topology-graph__edge-label">{edge.label}</text>
          {/if}
        </g>
      {/if}
    {/each}

    {#each layout.nodes as ln}
      {@const node = nodeMap.get(ln.id)}
      {#if node}
        {@const selected = selectedSet.has(node.id)}
        {@const color = statusColor(node.status)}
        {@const w = node.width || nodeW}
        {@const h = node.height || nodeH}
        {@const half = 7}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <g
          class="ui-topology-graph__node"
          transform={`translate(${ln.x},${ln.y})`}
          cursor={onNodeClick ? 'pointer' : undefined}
          onclick={onNodeClick ? () => onNodeClick(node) : undefined}
          onmouseenter={onNodeHover ? () => onNodeHover(node) : undefined}
          onmouseleave={onNodeHover ? () => onNodeHover(null) : undefined}
          data-status={node.status || 'unknown'}
          data-selected={selected || undefined}
          data-testid={`topology-node-${node.id}`}
        >
          {#if selected}
            <rect x={-w / 2 - 3} y={-h / 2 - 3} width={w + 6} height={h + 6} rx={8} fill="none" stroke={color} stroke-width={2} stroke-opacity={0.4} class="ui-topology-graph__node-glow" />
          {/if}
          <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={6} fill="oklch(20% 0.01 270)" stroke={color} stroke-width={selected ? 2.5 : 1.5} />
          <g use:cssProps={{ color }} transform="translate(0, -2)">
            {#if node.icon}<Content value={node.icon} />
            {:else if node.type === 'server'}<rect x={-half} y={-half} width={14} height={14} rx={2} fill="none" stroke="currentColor" stroke-width={1.5} />
            {:else if node.type === 'switch'}<polygon points={`0,${-half} ${half},0 0,${half} ${-half},0`} fill="none" stroke="currentColor" stroke-width={1.5} />
            {:else if node.type === 'router'}<circle cx={0} cy={0} r={half} fill="none" stroke="currentColor" stroke-width={1.5} />
            {:else if node.type === 'firewall'}<path d={`M0,${-half} L${half},${-half * 0.3} L${half},${half * 0.5} L0,${half} L${-half},${half * 0.5} L${-half},${-half * 0.3} Z`} fill="none" stroke="currentColor" stroke-width={1.5} />
            {:else if node.type === 'cloud'}<path d={`M${-half},${half * 0.2} a${half * 0.5},${half * 0.5} 0 0,1 ${half * 0.5},${-half * 0.7} a${half * 0.6},${half * 0.6} 0 0,1 ${half * 0.9},0 a${half * 0.4},${half * 0.4} 0 0,1 ${half * 0.1},${half * 0.7} Z`} fill="none" stroke="currentColor" stroke-width={1.5} />
            {:else if node.type === 'database'}<g>
                <ellipse cx={0} cy={-half * 0.4} rx={half} ry={half * 0.35} fill="none" stroke="currentColor" stroke-width={1.5} />
                <line x1={-half} y1={-half * 0.4} x2={-half} y2={half * 0.4} stroke="currentColor" stroke-width={1.5} />
                <line x1={half} y1={-half * 0.4} x2={half} y2={half * 0.4} stroke="currentColor" stroke-width={1.5} />
                <ellipse cx={0} cy={half * 0.4} rx={half} ry={half * 0.35} fill="none" stroke="currentColor" stroke-width={1.5} />
              </g>
            {:else if node.type === 'loadbalancer'}<g>
                <rect x={-half} y={-half} width={14} height={14} rx={2} fill="none" stroke="currentColor" stroke-width={1.5} />
                <line x1={-half * 0.5} y1={0} x2={half * 0.5} y2={0} stroke="currentColor" stroke-width={1.5} />
              </g>
            {:else}<circle cx={0} cy={0} r={half * 0.7} fill="none" stroke="currentColor" stroke-width={1.5} />
            {/if}
          </g>
          <text y={h / 2 + 12} text-anchor="middle" font-size={10} fill="oklch(75% 0 0)" class="ui-topology-graph__node-label">{node.label}</text>
        </g>
      {/if}
    {/each}
  </g>
</svg>
