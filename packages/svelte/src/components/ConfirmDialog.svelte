<script lang="ts">
  import type { Snippet } from 'svelte'
  import Content from '../lib/Content.svelte'
  import Dialog from './Dialog.svelte'
  import Button from './Button.svelte'
  import type { MotionLevel } from '../runes/context.js'

  interface Props {
    /** The dialog element (React's ConfirmDialog takes no ref). Read it with `bind:ref`. */
    ref?: HTMLDialogElement | null
    open: boolean
    onConfirm: () => void
    onCancel: () => void
    title: string | Snippet
    description?: string | Snippet
    confirmLabel?: string
    cancelLabel?: string
    variant?: 'default' | 'danger'
    loading?: boolean
    motion?: MotionLevel
  }

  let {
    open, onConfirm, onCancel, title, description, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
    variant = 'default', loading = false, motion, ref = $bindable(null),
  }: Props = $props()
</script>

<div class="ui-confirm-dialog">
  <Dialog {open} onClose={onCancel} {title} size="sm" showClose={false} {motion} bind:ref>
    {#if description}<div class="ui-confirm-dialog__description"><Content value={description} /></div>{/if}
    <div class="ui-confirm-dialog__actions">
      <Button variant="secondary" onclick={() => onCancel()} disabled={loading}>{cancelLabel}</Button>
      <Button variant={variant === 'danger' ? 'danger' : 'primary'} onclick={() => onConfirm()} {loading} disabled={loading}>{confirmLabel}</Button>
    </div>
  </Dialog>
</div>
