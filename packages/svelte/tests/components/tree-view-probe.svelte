<script lang="ts">
  import TreeView from '../../src/components/TreeView.svelte'
  import type { TreeNode } from '../../src/lib/tree-view.js'

  let { nodes, initial = [], lazy, onSelect, ignoreExpand = false }: {
    nodes: TreeNode[]; initial?: string[]; lazy?: (id: string) => Promise<TreeNode[]>; onSelect?: (id: string) => void; ignoreExpand?: boolean
  } = $props()
  // svelte-ignore state_referenced_locally
  let expanded = $state<string[]>(initial)
  let calls = $state<[string, boolean][]>([])
  export const getCalls = () => calls
  export const getExpanded = () => expanded
</script>

<TreeView {nodes} {expanded} {lazy} {onSelect} onExpand={(id, open) => { calls.push([id, open]); if (!ignoreExpand) expanded = open ? [...expanded, id] : expanded.filter(e => e !== id) }} />
