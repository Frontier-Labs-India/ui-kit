<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'
  import Icon from '../lib/Icon.svelte'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    /** Bindable; saving writes it and calls onChange. */
    value: string
    onChange?: (value: string) => void
    placeholder?: string
    disabled?: boolean
    size?: 'sm' | 'md' | 'lg'
    multiline?: boolean
    editTrigger?: 'click' | 'dblclick'
    onSave?: (value: string) => void
    onCancel?: () => void
    motion?: MotionLevel
    class?: string
  }

  let {
    value = $bindable(), onChange, placeholder, disabled = false, size = 'md', multiline = false, editTrigger = 'click',
    onSave, onCancel, motion, class: className, ref = $bindable(null), ...rest
  }: Props = $props()

  const cls = makeCls('inline-edit')
  const motionLevel = getMotionLevel(() => motion)
  let editing = $state(false)
  // svelte-ignore state_referenced_locally
  let editValue = $state(value)
  let field = $state<HTMLInputElement | HTMLTextAreaElement | null>(null)
  let display = $state<HTMLDivElement | null>(null)
  let wasEditing = false

  // Focus and select the field on entering; return focus to the display on leaving.
  $effect(() => {
    const now = editing
    if (now && field) {
      field.focus()
      field.select()
    }
    if (wasEditing && !now) requestAnimationFrame(() => display?.focus())
    wasEditing = now
  })

  function enter() {
    if (disabled) return
    editValue = value
    editing = true
  }

  function save() {
    /* Only while editing: a browser that fires blur as the focused field is
     * removed (after Enter, or after Escape) must not save a second time, or
     * save a cancelled edit. */
    if (!editing) return
    editing = false
    value = editValue
    onChange?.(editValue)
    onSave?.(editValue)
  }

  function cancel() {
    editing = false
    editValue = value
    onCancel?.()
  }

  function onFieldKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault()
      cancel()
      return
    }
    if (e.key === 'Enter' && (!multiline || e.ctrlKey)) {
      e.preventDefault()
      save()
    }
  }
</script>

<div class={cn(cls('root'), className)} data-size={size} data-motion={motionLevel()} data-disabled={disabled ? '' : undefined} bind:this={ref} {...rest}>
  {#if editing}
    {#if multiline}
      <textarea bind:this={field} class="ui-inline-edit__field" value={editValue} oninput={e => { editValue = e.currentTarget.value }} onkeydown={onFieldKeyDown} onblur={save} aria-label="Edit value" rows={3}></textarea>
    {:else}
      <input bind:this={field} type="text" class="ui-inline-edit__field" value={editValue} oninput={e => { editValue = e.currentTarget.value }} onkeydown={onFieldKeyDown} onblur={save} aria-label="Edit value" />
    {/if}
  {:else}
    <div
      bind:this={display}
      class="ui-inline-edit__display"
      role="button"
      tabindex={disabled ? -1 : 0}
      onclick={() => { if (editTrigger === 'click') enter() }}
      ondblclick={() => { if (editTrigger === 'dblclick') enter() }}
      onkeydown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); enter() } }}
      aria-label={`Edit: ${value || placeholder || 'empty'}`}
    >
      {#if value}<span class="ui-inline-edit__text">{value}</span>{:else}<span class="ui-inline-edit__placeholder">{placeholder || ''}</span>{/if}
      {#if !disabled}<span class="ui-inline-edit__icon" aria-hidden="true"><Icon name="edit" size="sm" /></span>{/if}
    </div>
  {/if}
</div>
