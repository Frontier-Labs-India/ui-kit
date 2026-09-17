/* Types shared by TopologyGraph and its two renderers — React declares them in
 * topology-graph-svg.tsx and re-exports them from topology-graph.tsx. */
import type { Snippet } from 'svelte'

export interface TopologyNode {
  id: string
  label: string
  type?: 'server' | 'switch' | 'router' | 'firewall' | 'cloud' | 'database' | 'loadbalancer' | 'custom'
  status?: 'ok' | 'warning' | 'critical' | 'unknown' | 'maintenance'
  icon?: string | Snippet
  group?: string
  metrics?: Record<string, number>
  x?: number
  y?: number
  width?: number
  height?: number
}

export interface TopologyEdge {
  source: string
  target: string
  label?: string
  status?: 'ok' | 'warning' | 'critical' | 'unknown'
  bandwidth?: number
  animated?: boolean
  bidirectional?: boolean
}

export interface TopologyRendererProps {
  layout: import('../vendor/core/graph/types.js').LayoutResult
  nodes: TopologyNode[]
  edges: TopologyEdge[]
  selectedNodes?: string[]
  onNodeClick?: (node: TopologyNode) => void
  onNodeHover?: (node: TopologyNode | null) => void
  onEdgeClick?: (edge: TopologyEdge) => void
  motionLevel: number
  width: number
  height: number
}
