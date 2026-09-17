<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLDialogAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import Content from '../lib/Content.svelte'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import { useGesture } from '../runes/gesture.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends Omit<HTMLDialogAttributes, 'title' | 'open'> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLDialogElement | null
    open: boolean
    onClose: () => void
    side?: 'left' | 'right' | 'bottom'
    title?: string | Snippet
    description?: string
    size?: 'sm' | 'md' | 'lg'
    showClose?: boolean
    children?: Snippet
    motion?: MotionLevel
    class?: string
  }

  let {
    open, onClose, side = 'right', title, description, size = 'md', showClose = true, children, motion, class: className, ref = $bindable(null), ...rest
  }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)
  const uid = $props.id()
  const titleId = `sheet-title-${uid}`
  const descId = `sheet-desc-${uid}`
  const dialog = $derived(ref)
  let swipe = $state<HTMLDivElement | null>(null)

  // Same modal handling as Dialog: the prop drives showModal()/close().
  $effect(() => {
    if (!dialog) return
    if (open) {
      if (!dialog.hasAttribute('open')) dialog.showModal()
    } else if (dialog.hasAttribute('open')) {
      dialog.close()
    }
  })

  // Swipe towards the sheet's own edge dismisses it.
  useGesture(() => swipe, () => ({
    onSwipe: direction => {
      if ((side === 'right' && direction === 'right') || (side === 'left' && direction === 'left') || (side === 'bottom' && direction === 'down')) onClose()
    },
  }))
</script>

<div class={cn('ui-sheet', className)}>
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <dialog
    bind:this={ref}
    data-side={side}
    data-size={size}
    data-motion={motionLevel()}
    aria-labelledby={title ? titleId : undefined}
    aria-describedby={description ? descId : undefined}
    onkeydown={e => { if (e.key === 'Escape') { e.preventDefault(); onClose() } }}
    onclick={e => { if (e.target === e.currentTarget) onClose() }}
    {...rest}
  >
    <div class="ui-sheet__swipe" bind:this={swipe}></div>
    {#if title || showClose}
      <div class="ui-sheet__header">
        <div class="ui-sheet__header-text">
          {#if title}<h2 class="ui-sheet__title" id={titleId}><Content value={title} /></h2>{/if}
          {#if description}<p class="ui-sheet__description" id={descId}>{description}</p>{/if}
        </div>
        {#if showClose}
          <button type="button" class="ui-sheet__close" onclick={() => onClose()} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
          </button>
        {/if}
      </div>
    {/if}
    <div class="ui-sheet__body">{#if children}{@render children()}{/if}</div>
  </dialog>
</div>
