<script lang="ts">
  import Content from './Content.svelte'
  import TreeItem from './TreeItem.svelte'
  import { cssProps } from '../actions/css-props.js'
  import { reactStyle } from './react-style.js'
  import { hasExpandableChildren, type TreeNode } from './tree-view.js'

  // One node of TreeView and, recursively, its expanded children.
  let { node, depth, expandedSet, selectedSet, loadingSet, lazyChildren, onToggle, onSelect, motionLevel }: {
    node: TreeNode
    depth: number
    expandedSet: Set<string>
    selectedSet: Set<string>
    loadingSet: Set<string>
    lazyChildren: Map<string, TreeNode[]>
    onToggle: (id: string) => void
    onSelect: (id: string) => void
    motionLevel: number
  } = $props()

  const isExpandable = $derived(hasExpandableChildren(node))
  const isExpanded = $derived(expandedSet.has(node.id))
  const isSelected = $derived(selectedSet.has(node.id))
  const isDisabled = $derived(!!node.disabled)
  const children = $derived(lazyChildren.get(node.id) ?? node.children)

  function rowClick() {
    if (isDisabled) return
    if (isExpandable) onToggle(node.id)
    onSelect(node.id)
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions (as React: the tree handles keys) -->
<li role="treeitem" aria-expanded={isExpandable ? isExpanded : undefined} aria-selected={isSelected} aria-disabled={isDisabled || undefined} tabindex="-1" data-node-id={node.id}
><div class="ui-tree-view__row" use:cssProps={reactStyle({ '--depth': depth })} onclick={rowClick} data-selected={isSelected ? '' : undefined} aria-disabled={isDisabled ? 'true' : undefined}
  >{#if isExpandable}<button class="ui-tree-view__toggle" data-toggle="" data-expanded={isExpanded ? '' : undefined} onclick={e => { e.stopPropagation(); if (!isDisabled) onToggle(node.id) }} tabindex="-1" aria-hidden="true"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg></button>{:else}<span class="ui-tree-view__spacer"></span>{/if}{#if node.icon}<span class="ui-tree-view__icon"><Content value={node.icon} /></span>{:else if node.icon === 0}0{/if}<span class="ui-tree-view__label"><Content value={node.label} /></span></div
  >{#if isExpandable}<div class="ui-tree-view__group" role="group" data-motion={motionLevel} data-expanded={isExpanded ? '' : undefined}><div class="ui-tree-view__group-inner">{#if loadingSet.has(node.id)}<div class="ui-tree-view__loading" data-loading="true" use:cssProps={reactStyle({ '--depth': depth })}><span class="ui-tree-view__spinner"></span>Loading...</div>{/if}{#if children && children.length > 0 && isExpanded}{#each children as child (child.id)}<TreeItem node={child} depth={depth + 1} {expandedSet} {selectedSet} {loadingSet} {lazyChildren} {onToggle} {onSelect} {motionLevel} />{/each}{/if}</div></div>{/if}</li>
