<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { SvelteSet } from 'svelte/reactivity'
  import { cn } from '../lib/cls.js'
  import { computeDiff, foldDiffLines, type DiffLine } from '../lib/diff.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends HTMLAttributes<HTMLDivElement> {
    oldValue: string
    newValue: string
    oldTitle?: string
    newTitle?: string
    mode?: 'side-by-side' | 'unified'
    showLineNumbers?: boolean
    foldUnchanged?: boolean
    foldThreshold?: number
    /** Accepted for API parity; React reads it nowhere, and nor does this. */
    language?: string
    motion?: MotionLevel
    class?: string
  }

  let {
    oldValue, newValue, oldTitle, newTitle, mode = 'unified', showLineNumbers = true, foldUnchanged = true, foldThreshold = 3,
    language: _language, motion, class: className, ...rest
  }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)
  const lines = $derived(computeDiff(oldValue, newValue))
  const items = $derived(foldUnchanged ? foldDiffLines(lines, foldThreshold) : [{ kind: 'lines' as const, lines }])
  const expanded = new SvelteSet<number>()
  const toggle = (id: number) => (expanded.has(id) ? expanded.delete(id) : expanded.add(id))
  const prefix = (l: DiffLine) => (l.type === 'added' ? '+' : l.type === 'removed' ? '-' : ' ')
</script>

{#snippet row(line: DiffLine, unified: boolean)}
  <div class={`ui-diff-viewer__line ui-diff-viewer__line--${line.type}`}>
    {#if showLineNumbers && unified}
      <span class="ui-diff-viewer__line-number" aria-hidden="true">{line.oldLineNum ?? ''}</span><span class="ui-diff-viewer__line-number" aria-hidden="true">{line.newLineNum ?? ''}</span>
    {/if}
    {#if showLineNumbers && !unified}<span class="ui-diff-viewer__line-number" aria-hidden="true">{line.oldLineNum ?? line.newLineNum ?? ''}</span>{/if}
    {#if unified}<span class="ui-diff-viewer__prefix" aria-hidden="true">{prefix(line)}</span>{/if}
    <span class="ui-diff-viewer__content">{line.value}</span>
  </div>
{/snippet}

<div class={cn('ui-diff-viewer', className)} data-mode={mode} data-motion={motionLevel()} {...rest}>
  {#if oldTitle || newTitle}
    <div class="ui-diff-viewer__titles">
      {#if oldTitle}<div class="ui-diff-viewer__title">{oldTitle}</div>{/if}
      {#if newTitle}<div class="ui-diff-viewer__title">{newTitle}</div>{/if}
    </div>
  {/if}
  {#if mode === 'unified'}
    <div class="ui-diff-viewer__unified">
      {#each items as item, idx (item.kind === 'fold' ? `fold-${item.id}` : idx)}
        {#if item.kind === 'fold' && !expanded.has(item.id)}
          <div
            class="ui-diff-viewer__fold"
            role="button"
            tabindex={0}
            onclick={() => toggle(item.id)}
            onkeydown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(item.id) } }}
          >{item.lines.length} unchanged line{item.lines.length !== 1 ? 's' : ''}</div>
        {:else}
          <div>{#each item.lines as line, li (li)}{@render row(line, true)}{/each}</div>
        {/if}
      {/each}
    </div>
  {:else}
    <div class="ui-diff-viewer__side-by-side">
      <div class="ui-diff-viewer__pane ui-diff-viewer__pane--old">{#each lines.filter(l => l.type !== 'added') as line, i (i)}{@render row(line, false)}{/each}</div>
      <div class="ui-diff-viewer__pane ui-diff-viewer__pane--new">{#each lines.filter(l => l.type !== 'removed') as line, i (i)}{@render row(line, false)}{/each}</div>
    </div>
  {/if}
</div>
