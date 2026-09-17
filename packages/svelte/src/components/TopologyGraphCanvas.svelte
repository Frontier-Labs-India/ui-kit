<script lang="ts">
  import { cssProps } from '../actions/css-props.js'
  import { reactStyle } from '../lib/react-style.js'
  import { Quadtree } from '../vendor/core/graph/quadtree.js'
  import type { TopologyRendererProps } from '../lib/topology.js'

  let {
    layout, nodes, edges, selectedNodes = [], onNodeClick, onNodeHover, onEdgeClick: _onEdgeClick, motionLevel, width, height, ref = $bindable(null),
  }: TopologyRendererProps & {
    /** The <canvas> element (React's renderer takes no ref). Read it with `bind:ref`. */
    ref?: HTMLCanvasElement | null
  } = $props()

  // Canvas-compatible hex approximations of the OKLCH status colours.
  const STATUS_FILL: Record<string, string> = {
    ok: '#4ead6a',
    warning: '#c9a83e',
    critical: '#c44d3b',
    unknown: '#777777',
    maintenance: '#7b6fc0',
  }
  const colorOf = (status?: string) => STATUS_FILL[status || 'unknown'] || STATUS_FILL.unknown

  const canvas = $derived(ref)
  let pan = $state({ x: 0, y: 0 })
  let zoom = $state(1)
  let dragging = $state(false)
  let dragStart = { x: 0, y: 0, panX: 0, panY: 0 }
  let dashOffset = 0

  const nodeMap = $derived(new Map(nodes.map(n => [n.id, n])))
  const selectedSet = $derived(new Set(selectedNodes))

  // Quadtree for hit testing, rebuilt when the layout or size changes.
  const quadtree = $derived.by(() => {
    const qt = new Quadtree(0, 0, layout.width || width, layout.height || height)
    for (const ln of layout.nodes) qt.insert({ x: ln.x, y: ln.y, mass: 1, data: ln.id })
    return qt
  })

  function screenToGraph(sx: number, sy: number) {
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return { x: (sx - rect.left - pan.x) / zoom, y: (sy - rect.top - pan.y) / zoom }
  }

  $effect(() => {
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    // Read every input up front so the effect re-runs when any of them changes.
    const w0 = width, h0 = height, p = pan, z = zoom, level = motionLevel
    const lay = layout, es = edges, map = nodeMap, sel = selectedSet

    const dpr = window.devicePixelRatio || 1
    canvas.width = w0 * dpr
    canvas.height = h0 * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    let running = true
    let frame = 0

    function draw() {
      if (!running || !ctx) return
      ctx.clearRect(0, 0, w0, h0)
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.scale(z, z)

      for (let i = 0; i < lay.edges.length; i++) {
        const le = lay.edges[i]
        const edge = es[i]
        if (!edge || le.points.length < 2) continue
        const start = le.points[0]
        const end = le.points[le.points.length - 1]
        const color = colorOf(edge.status)

        ctx.beginPath()
        ctx.strokeStyle = color
        ctx.lineWidth = edge.bandwidth ? Math.min(edge.bandwidth / 100, 4) + 1 : 1.5
        ctx.globalAlpha = 0.7
        if (edge.animated && level >= 2) {
          ctx.setLineDash([6, 4])
          ctx.lineDashOffset = dashOffset
        } else {
          ctx.setLineDash([])
        }
        const mx = (start.x + end.x) / 2
        const my = (start.y + end.y) / 2
        ctx.moveTo(start.x, start.y)
        ctx.quadraticCurveTo(mx, my, end.x, end.y)
        ctx.stroke()
        ctx.setLineDash([])
        ctx.globalAlpha = 1.0

        const angle = Math.atan2(end.y - my, end.x - mx)
        ctx.save()
        ctx.translate(end.x, end.y)
        ctx.rotate(angle)
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(-8, -3)
        ctx.lineTo(-8, 3)
        ctx.closePath()
        ctx.fillStyle = color
        ctx.fill()
        ctx.restore()

        if (edge.label) {
          ctx.fillStyle = '#aaa'
          ctx.font = '9px sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText(edge.label, mx, my - 6)
        }
      }

      for (const ln of lay.nodes) {
        const node = map.get(ln.id)
        if (!node) continue
        const color = colorOf(node.status)
        const w = node.width || 40
        const h = node.height || 30
        const selected = sel.has(node.id)

        if (selected) {
          ctx.strokeStyle = color
          ctx.lineWidth = 2
          ctx.globalAlpha = 0.4
          ctx.strokeRect(ln.x - w / 2 - 3, ln.y - h / 2 - 3, w + 6, h + 6)
          ctx.globalAlpha = 1.0
        }

        ctx.fillStyle = '#2a2a35'
        ctx.strokeStyle = color
        ctx.lineWidth = selected ? 2.5 : 1.5
        ctx.beginPath()
        ctx.roundRect(ln.x - w / 2, ln.y - h / 2, w, h, 6)
        ctx.fill()
        ctx.stroke()

        ctx.strokeStyle = color
        ctx.lineWidth = 1.5
        ctx.beginPath()
        switch (node.type) {
          case 'server':
            ctx.rect(ln.x - 5, ln.y - 7, 10, 10)
            break
          case 'router':
            ctx.arc(ln.x, ln.y - 2, 6, 0, Math.PI * 2)
            break
          case 'switch':
            ctx.moveTo(ln.x, ln.y - 8)
            ctx.lineTo(ln.x + 6, ln.y - 2)
            ctx.lineTo(ln.x, ln.y + 4)
            ctx.lineTo(ln.x - 6, ln.y - 2)
            ctx.closePath()
            break
          default:
            ctx.arc(ln.x, ln.y - 2, 5, 0, Math.PI * 2)
            break
        }
        ctx.stroke()

        ctx.fillStyle = '#bbb'
        ctx.font = '10px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(node.label, ln.x, ln.y + h / 2 + 12)
      }

      ctx.restore()

      if (level >= 2) {
        dashOffset -= 0.5
        frame = requestAnimationFrame(draw)
      }
    }

    draw()
    return () => {
      running = false
      if (frame) cancelAnimationFrame(frame)
    }
  })

  function handleMouseDown(e: MouseEvent) {
    dragging = true
    dragStart = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y }
  }

  function handleMouseMove(e: MouseEvent) {
    if (dragging) {
      pan = { x: dragStart.panX + e.clientX - dragStart.x, y: dragStart.panY + e.clientY - dragStart.y }
      return
    }
    if (onNodeHover) {
      const pt = screenToGraph(e.clientX, e.clientY)
      const found = quadtree.find(pt.x, pt.y, 25)
      const node = found?.data ? nodeMap.get(found.data as string) : undefined
      onNodeHover(node ?? null)
    }
  }

  function handleClick(e: MouseEvent) {
    if (!onNodeClick) return
    const pt = screenToGraph(e.clientX, e.clientY)
    const found = quadtree.find(pt.x, pt.y, 25)
    const node = found?.data ? nodeMap.get(found.data as string) : undefined
    if (node) onNodeClick(node)
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

<!-- React reads its drag ref while rendering, so its cursor updates only on the
     next re-render and can stay 'grabbing' after release. Here `dragging` is
     state, so the cursor is simply current; the draw effect does not read it. -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<canvas
  bind:this={ref}
  {width}
  {height}
  use:cssProps={reactStyle({ width, height, cursor: dragging ? 'grabbing' : 'grab' })}
  class="ui-topology-graph__canvas"
  onmousedown={handleMouseDown}
  onmousemove={handleMouseMove}
  onmouseup={() => { dragging = false }}
  onclick={handleClick}
  onwheel={handleWheel}
  data-testid="topology-canvas"
></canvas>
