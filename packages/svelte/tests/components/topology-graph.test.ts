import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent } from '@testing-library/svelte'
import { createRawSnippet, flushSync } from 'svelte'
import TopologyGraph from '../../src/components/TopologyGraph.svelte'
import TopologyGraphCanvas from '../../src/components/TopologyGraphCanvas.svelte'
import { computeLayout } from '../../src/vendor/core/graph/layout.js'

const nodes = [
  { id: 'a', label: 'A', x: 100, y: 100 },
  { id: 'b', label: 'B', x: 300, y: 100 },
  { id: 'c', label: 'C', x: 200, y: 300 },
]
const edges = [{ source: 'a', target: 'b' }, { source: 'b', target: 'c' }]

afterEach(() => vi.restoreAllMocks())

describe('TopologyGraph (SVG renderer)', () => {
  it('calls node and edge callbacks with the item', async () => {
    const onNodeClick = vi.fn()
    const onNodeHover = vi.fn()
    const onEdgeClick = vi.fn()
    const { getByTestId, container } = render(TopologyGraph, { props: { nodes, edges, onNodeClick, onNodeHover, onEdgeClick } })
    const b = getByTestId('topology-node-b')
    await fireEvent.click(b)
    expect(onNodeClick).toHaveBeenCalledWith(nodes[1])
    await fireEvent.mouseEnter(b)
    expect(onNodeHover).toHaveBeenLastCalledWith(nodes[1])
    await fireEvent.mouseLeave(b)
    expect(onNodeHover).toHaveBeenLastCalledWith(null)
    await fireEvent.click(container.querySelectorAll('.ui-topology-graph__edge path')[1])
    expect(onEdgeClick).toHaveBeenCalledWith(edges[1])
  })

  it('pans on background drag, not on a node, and stops on a window mouseup', async () => {
    const { getByTestId } = render(TopologyGraph, { props: { nodes, edges } })
    const svg = getByTestId('topology-svg')
    const g = () => svg.querySelector(':scope > g')!.getAttribute('transform')
    await fireEvent.mouseDown(getByTestId('topology-node-a'), { clientX: 0, clientY: 0 })
    await fireEvent.mouseMove(svg, { clientX: 50, clientY: 50 })
    expect(g()).toBe('translate(0,0) scale(1)')
    await fireEvent.mouseDown(svg, { clientX: 10, clientY: 10 })
    expect(svg.style.getPropertyValue('cursor')).toBe('grabbing')
    await fireEvent.mouseMove(svg, { clientX: 40, clientY: 30 })
    expect(g()).toBe('translate(30,20) scale(1)')
    window.dispatchEvent(new MouseEvent('mouseup'))
    flushSync()
    expect(svg.style.getPropertyValue('cursor')).toBe('grab')
    await fireEvent.mouseMove(svg, { clientX: 90, clientY: 90 })
    expect(g()).toBe('translate(30,20) scale(1)')
  })

  it('wheel zooms within 0.1–5 and prevents page scroll', async () => {
    const { getByTestId } = render(TopologyGraph, { props: { nodes, edges } })
    const svg = getByTestId('topology-svg')
    const e = new WheelEvent('wheel', { deltaY: -1, cancelable: true, bubbles: true })
    svg.dispatchEvent(e)
    flushSync()
    expect(e.defaultPrevented).toBe(true)
    expect(svg.querySelector(':scope > g')!.getAttribute('transform')).toBe('translate(0,0) scale(1.1)')
    for (let i = 0; i < 60; i++) svg.dispatchEvent(new WheelEvent('wheel', { deltaY: 1, cancelable: true }))
    flushSync()
    expect(svg.querySelector(':scope > g')!.getAttribute('transform')).toBe('translate(0,0) scale(0.1)')
  })

  it('renders a snippet icon inside the node instead of the type shape', () => {
    const icon = createRawSnippet(() => ({ render: () => '<circle r="2" class="probe"></circle>' }))
    const { getByTestId } = render(TopologyGraph, { props: { nodes: [{ id: 'x', label: 'X', type: 'server', icon }], edges: [] } })
    const g = getByTestId('topology-node-x').querySelector('g')!
    expect(g.querySelector('.probe')).not.toBeNull()
    expect(g.querySelector('rect')).toBeNull()
  })

  it('applies nodeFilter, drops edges to filtered nodes, then applies edgeFilter', () => {
    const { container, queryByTestId } = render(TopologyGraph, {
      props: {
        nodes, edges: [...edges, { source: 'a', target: 'c', label: 'skip' }],
        nodeFilter: (n: { id: string }) => n.id !== 'b',
        edgeFilter: (e: { label?: string }) => e.label !== 'skip',
      },
    })
    expect(queryByTestId('topology-node-b')).toBeNull()
    expect(queryByTestId('topology-node-a')).not.toBeNull()
    expect(container.querySelectorAll('.ui-topology-graph__edge')).toHaveLength(0)
  })

  it('switches to canvas above 500 nodes when renderer is auto', () => {
    const many = Array.from({ length: 501 }, (_, i) => ({ id: `n${i}`, label: `N${i}` }))
    const { queryByTestId } = render(TopologyGraph, { props: { nodes: many, edges: [], layout: 'grid' } })
    expect(queryByTestId('topology-canvas')).not.toBeNull()
    expect(queryByTestId('topology-svg')).toBeNull()
  })

  it('lays out to the observed container width', () => {
    let cb: ResizeObserverCallback | undefined
    const disconnect = vi.fn()
    vi.stubGlobal('ResizeObserver', class { constructor(c: ResizeObserverCallback) { cb = c } observe() {} disconnect() { disconnect() } })
    try {
      const { getByTestId, unmount } = render(TopologyGraph, { props: { nodes, edges } })
      expect(getByTestId('topology-svg').getAttribute('width')).toBe('800')
      cb!([{ contentRect: { width: 640 } } as ResizeObserverEntry], {} as ResizeObserver)
      flushSync()
      expect(getByTestId('topology-svg').getAttribute('viewBox')).toBe('0 0 640 500')
      unmount()
      expect(disconnect).toHaveBeenCalledOnce()
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('removes its window mouseup listener on unmount', () => {
    const add = vi.spyOn(window, 'addEventListener')
    const remove = vi.spyOn(window, 'removeEventListener')
    const { unmount } = render(TopologyGraph, { props: { nodes, edges } })
    const ups = add.mock.calls.filter(c => c[0] === 'mouseup').map(c => c[1])
    expect(ups).toHaveLength(1)
    unmount()
    expect(remove.mock.calls.filter(c => c[0] === 'mouseup').map(c => c[1])).toEqual(ups)
  })

  it('inherited: the zoom buttons change nothing visible, as in React', async () => {
    const { getByTestId } = render(TopologyGraph, { props: { nodes, edges } })
    const before = getByTestId('topology-svg').outerHTML
    await fireEvent.click(getByTestId('topology-zoom-in'))
    expect(getByTestId('topology-svg').outerHTML).toBe(before)
  })
})

describe('TopologyGraphCanvas', () => {
  function recorder() {
    const calls: string[] = []
    const ctx = new Proxy({} as Record<string, unknown>, {
      get: (t, k: string) => (k in t ? t[k] : (...args: unknown[]) => { calls.push(`${k}(${args.join(',')})`) }),
      set: (t, k: string, v) => { t[k] = v; return true },
    })
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as unknown as CanvasRenderingContext2D)
    return calls
  }
  const layout = computeLayout(
    nodes.map(n => ({ id: n.id, x: n.x, y: n.y, width: 40, height: 30, fx: n.x, fy: n.y })),
    edges.map(e => ({ source: e.source, target: e.target })),
    { type: 'force', width: 400, height: 400 },
  )

  it('draws every label and hit-tests clicks and hovers through the quadtree', async () => {
    const calls = recorder()
    vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0 } as DOMRect)
    const onNodeClick = vi.fn()
    const onNodeHover = vi.fn()
    const { getByTestId } = render(TopologyGraphCanvas, { props: { layout, nodes, edges, motionLevel: 0, width: 400, height: 400, onNodeClick, onNodeHover } })
    for (const n of nodes) expect(calls.some(c => c.startsWith(`fillText(${n.label},`))).toBe(true)
    const a = layout.nodes.find(n => n.id === 'a')!
    const canvas = getByTestId('topology-canvas')
    await fireEvent.click(canvas, { clientX: a.x + 3, clientY: a.y })
    expect(onNodeClick).toHaveBeenCalledWith(nodes[0])
    await fireEvent.mouseMove(canvas, { clientX: 5000, clientY: 5000 })
    expect(onNodeHover).toHaveBeenLastCalledWith(null)
  })

  it('animates with requestAnimationFrame at motion ≥ 2 and cancels on unmount', () => {
    recorder()
    const raf = vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(42)
    const caf = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
    const { unmount } = render(TopologyGraphCanvas, { props: { layout, nodes, edges, motionLevel: 2, width: 400, height: 400 } })
    expect(raf).toHaveBeenCalled()
    unmount()
    expect(caf).toHaveBeenCalledWith(42)
  })

  it('does not start a frame loop below motion 2', () => {
    recorder()
    const raf = vi.spyOn(window, 'requestAnimationFrame')
    render(TopologyGraphCanvas, { props: { layout, nodes, edges, motionLevel: 1, width: 400, height: 400 } })
    expect(raf).not.toHaveBeenCalled()
  })
})
