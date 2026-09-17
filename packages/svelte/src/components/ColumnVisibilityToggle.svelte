<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    columns: { id: string; label: string; visible: boolean }[]
    onChange?: (columnId: string, visible: boolean) => void
    onReset?: () => void
    motion?: MotionLevel
    class?: string
  }

  let { columns, onChange, onReset, motion, class: className, ref = $bindable(null), ...rest }: Props = $props()

  const cls = makeCls('column-visibility')
  const motionLevel = getMotionLevel(() => motion)
  let open = $state(false)
  const container = $derived(ref)

  // Outside click and Escape close.
  $effect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (container && !container.contains(e.target as Node)) open = false
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') open = false
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  })

  const visibleCount = $derived(columns.filter(c => c.visible).length)
</script>

<div bind:this={ref} class={cn(cls('root'), className)} data-motion={motionLevel()} {...rest}>
  <button type="button" class="ui-column-visibility__trigger" aria-expanded={open} aria-haspopup="listbox" onclick={() => { open = !open }}>
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" /></svg>
    Columns ({visibleCount}/{columns.length})
  </button>
  <div class="ui-column-visibility__dropdown" role="listbox" aria-label="Toggle column visibility" data-open={open}>
    {#each columns as col (col.id)}
      <label class="ui-column-visibility__item">
        <!-- The checkbox shows `columns`, which only the caller changes: after
             reporting, it is set back to the data, as React's controlled input is. -->
        <input
          type="checkbox"
          class="ui-column-visibility__checkbox"
          checked={col.visible}
          onchange={e => { onChange?.(col.id, !col.visible); e.currentTarget.checked = col.visible }}
        />
        {col.label}
      </label>
    {/each}
    {#if onReset}
      <div class="ui-column-visibility__divider"></div>
      <button type="button" class="ui-column-visibility__reset" onclick={() => onReset?.()}>Reset to default</button>
    {/if}
  </div>
</div>
