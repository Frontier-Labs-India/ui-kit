<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLDialogAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import Content from '../lib/Content.svelte'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends Omit<HTMLDialogAttributes, 'title' | 'open'> {
    open: boolean
    onClose: () => void
    title?: string | Snippet
    description?: string
    size?: 'sm' | 'md' | 'lg' | 'full'
    closeOnOverlay?: boolean
    closeOnEscape?: boolean
    showClose?: boolean
    footer?: string | Snippet
    preventClose?: boolean
    children?: Snippet
    motion?: MotionLevel
    classNames?: Partial<Record<'root' | 'header' | 'title' | 'description' | 'body' | 'close' | 'footer', string>>
    class?: string
  }

  let {
    open, onClose, title, description, size = 'md', closeOnOverlay = true, closeOnEscape = true,
    showClose = true, footer, preventClose = false, children, motion, classNames, class: className, ...rest
  }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)
  const uid = $props.id()
  const titleId = `dialog-title-${uid}`
  const descId = `dialog-desc-${uid}`
  let dialog: HTMLDialogElement | undefined

  /* The element's open state follows the prop through the modal API, never
   * the `open` attribute: only showModal() gives the top layer, inert
   * background and ::backdrop. */
  $effect(() => {
    if (!dialog) return
    if (open) {
      if (!dialog.hasAttribute('open')) dialog.showModal()
    } else if (dialog.hasAttribute('open')) {
      dialog.close()
    }
  })

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key !== 'Escape') return
    // Always prevent the native close so the prop stays the source of truth.
    e.preventDefault()
    if (preventClose) return
    if (closeOnEscape) onClose()
  }

  function handleClick(e: MouseEvent) {
    if (preventClose || !closeOnOverlay) return
    // A click whose target is the <dialog> itself landed on the backdrop.
    if (e.target === e.currentTarget) onClose()
  }
</script>

<div class={cn('ui-dialog', classNames?.root, className)}>
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <dialog
    bind:this={dialog}
    data-size={size}
    data-motion={motionLevel()}
    aria-labelledby={title ? titleId : undefined}
    aria-describedby={description ? descId : undefined}
    onkeydown={handleKeyDown}
    onclick={handleClick}
    {...rest}
  >
    {#if title || showClose}
      <div class={cn('ui-dialog__header', classNames?.header)}>
        <div class="ui-dialog__header-text">
          {#if title}<h2 class={cn('ui-dialog__title', classNames?.title)} id={titleId}><Content value={title} /></h2>{/if}
          {#if description}<p class={cn('ui-dialog__description', classNames?.description)} id={descId}>{description}</p>{/if}
        </div>
        {#if showClose}
          <button type="button" class={cn('ui-dialog__close', classNames?.close)} onclick={() => onClose()} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
          </button>
        {/if}
      </div>
    {/if}
    <div class={cn('ui-dialog__body', classNames?.body)}>{#if children}{@render children()}{/if}</div>
    {#if footer}<div class={cn('ui-dialog__footer', classNames?.footer)}><Content value={footer} /></div>{/if}
  </dialog>
</div>
