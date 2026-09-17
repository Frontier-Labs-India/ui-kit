/* TreeView's pure helpers, copied from src/domain/tree-view.tsx (drift-tested
 * in tests/lib/tree-view-drift.test.ts). */
import type { Snippet } from 'svelte'

export interface TreeNode {
  id: string
  label: string | Snippet
  icon?: string | number | Snippet
  children?: TreeNode[]
  disabled?: boolean
  data?: unknown
}

export function findParentId(
  nodeId: string,
  nodes: TreeNode[],
  parentId: string | null = null,
  lazyChildren: Map<string, TreeNode[]> = new Map(),
): string | null {
  for (const node of nodes) {
    if (node.id === nodeId) return parentId
    const children = lazyChildren.get(node.id) ?? node.children
    if (children) {
      const found = findParentId(nodeId, children, node.id, lazyChildren)
      if (found !== null) return found
    }
  }
  return null
}

export function hasExpandableChildren(node: TreeNode): boolean {
  return Array.isArray(node.children)
}

export function findNodeById(
  id: string,
  nodes: TreeNode[],
  lazyChildren: Map<string, TreeNode[]> = new Map()
): TreeNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node
    const children = lazyChildren.get(node.id) ?? node.children
    if (children) {
      const found = findNodeById(id, children, lazyChildren)
      if (found) return found
    }
  }
  return undefined
}
