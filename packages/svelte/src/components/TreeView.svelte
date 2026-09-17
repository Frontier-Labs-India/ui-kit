<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { SvelteMap, SvelteSet } from 'svelte/reactivity'
  import { makeCls, cn } from '../lib/cls.js'
  import { cssProps } from '../actions/css-props.js'
  import { reactStyle } from '../lib/react-style.js'
  import TreeItem from '../lib/TreeItem.svelte'
  import { findNodeById, findParentId, hasExpandableChildren, type TreeNode } from '../lib/tree-view.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'onselect'> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    nodes: TreeNode[]
    selected?: string | string[]
    onSelect?: (nodeId: string) => void
    expanded?: string[]
    onExpand?: (nodeId: string, expanded: boolean) => void
    multiSelect?: boolean
    lazy?: (nodeId: string) => Promise<TreeNode[]>
    showGuides?: boolean
    motion?: MotionLevel
    class?: string
  }

  let {
    nodes, selected, onSelect, expanded = [], onExpand, multiSelect = false, lazy, showGuides = true, motion,
    class: className, ref = $bindable(null), ...rest
  }: Props = $props()

  const cls = makeCls('tree-view')
  const motionLevel = getMotionLevel(() => motion)
  let tree = $state<HTMLUListElement | null>(null)
  const loadingSet = new SvelteSet<string>()
  const lazyChildren = new SvelteMap<string, TreeNode[]>()

  const expandedSet = $derived(new Set(expanded))
  const selectedSet = $derived(new Set(Array.isArray(selected) ? selected : selected ? [selected] : []))

  // The first item is the tab stop, written to the DOM as React's effect does.
  $effect(() => {
    void nodes; void expanded
    tree?.querySelectorAll<HTMLElement>('[role="treeitem"]').forEach((item, i) => item.setAttribute('tabindex', i === 0 ? '0' : '-1'))
  })

  // Expanded nodes with empty children load through `lazy`, as React's effect does.
  $effect(() => {
    if (!lazy) return
    const load = lazy
    for (const nodeId of expanded) {
      if (lazyChildren.has(nodeId) || loadingSet.has(nodeId)) continue
      const node = findNodeById(nodeId, nodes, lazyChildren)
      if (node && Array.isArray(node.children) && node.children.length === 0) {
        loadingSet.add(nodeId)
        load(nodeId)
          .then(children => { lazyChildren.set(nodeId, children); loadingSet.delete(nodeId) })
          .catch(() => { loadingSet.delete(nodeId) })
      }
    }
  })

  async function toggle(nodeId: string) {
    const isExpanded = expandedSet.has(nodeId)
    if (!isExpanded && lazy) {
      // React's lookup here ignores lazily loaded children; kept.
      const find = (ns: TreeNode[]): TreeNode | undefined => {
        for (const n of ns) {
          if (n.id === nodeId) return n
          if (n.children) { const found = find(n.children); if (found) return found }
        }
        return undefined
      }
      const existing = lazyChildren.get(nodeId) ?? find(nodes)?.children
      if (existing && existing.length === 0 && !lazyChildren.has(nodeId)) {
        loadingSet.add(nodeId)
        try {
          lazyChildren.set(nodeId, await lazy(nodeId))
        } finally {
          loadingSet.delete(nodeId)
        }
      }
    }
    onExpand?.(nodeId, !isExpanded)
  }

  const select = (nodeId: string) => onSelect?.(nodeId)

  function onkeydown(e: KeyboardEvent) {
    if (!tree) return
    const all = tree.querySelectorAll<HTMLElement>('[role="treeitem"]')
    const focused = document.activeElement as HTMLElement
    const index = [...all].indexOf(focused)
    if (index < 0) return
    const id = focused.getAttribute('data-node-id') || ''
    const focusItem = (i: number) => {
      if (i >= 0 && i < all.length) {
        focused.setAttribute('tabindex', '-1')
        all[i].setAttribute('tabindex', '0')
        all[i].focus()
      }
    }
    const nextEnabled = (start: number, dir: 1 | -1) => {
      for (let i = start + dir; i >= 0 && i < all.length; i += dir) {
        if (all[i].getAttribute('aria-disabled') !== 'true') return i
      }
      return -1
    }
    switch (e.key) {
      case 'ArrowDown': { e.preventDefault(); const n = nextEnabled(index, 1); if (n >= 0) focusItem(n); break }
      case 'ArrowUp': { e.preventDefault(); const p = nextEnabled(index, -1); if (p >= 0) focusItem(p); break }
      case 'ArrowRight': {
        e.preventDefault()
        const node = findNodeById(id, nodes, lazyChildren)
        if (node && hasExpandableChildren(node)) {
          if (expandedSet.has(id)) { const n = nextEnabled(index, 1); if (n >= 0) focusItem(n) }
          else toggle(id)
        }
        break
      }
      case 'ArrowLeft': {
        e.preventDefault()
        const node = findNodeById(id, nodes, lazyChildren)
        if (node && hasExpandableChildren(node) && expandedSet.has(id)) {
          onExpand?.(id, false)
        } else {
          const parentId = findParentId(id, nodes, null, lazyChildren)
          const parent = parentId ? tree.querySelector<HTMLElement>(`[data-node-id="${parentId}"]`) : null
          if (parent) {
            focused.setAttribute('tabindex', '-1')
            parent.setAttribute('tabindex', '0')
            parent.focus()
          }
        }
        break
      }
      case 'Home': e.preventDefault(); focusItem(0); break
      case 'End': e.preventDefault(); focusItem(all.length - 1); break
      case 'Enter':
      case ' ': {
        e.preventDefault()
        const node = findNodeById(id, nodes, lazyChildren)
        if (node && !node.disabled) select(id)
        break
      }
      case '*': {
        e.preventDefault()
        const parentId = findParentId(id, nodes, null, lazyChildren)
        const siblings = parentId ? (lazyChildren.get(parentId) ?? findNodeById(parentId, nodes, lazyChildren)?.children ?? []) : nodes
        for (const sibling of siblings) {
          if (hasExpandableChildren(sibling) && !expandedSet.has(sibling.id)) onExpand?.(sibling.id, true)
        }
        break
      }
    }
  }
</script>

<div bind:this={ref} class={cn(cls('root'), className)} data-motion={motionLevel()} data-guides={showGuides || undefined} {...rest}
><ul bind:this={tree} role="tree" aria-multiselectable={multiSelect || undefined} {onkeydown} use:cssProps={reactStyle({ listStyle: 'none', margin: 0, padding: 0 })}
  >{#each nodes as node (node.id)}<TreeItem {node} depth={0} {expandedSet} {selectedSet} {loadingSet} {lazyChildren} onToggle={toggle} onSelect={select} motionLevel={motionLevel()} />{/each}</ul></div>
