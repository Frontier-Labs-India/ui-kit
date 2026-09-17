<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'
  import Content from '../lib/Content.svelte'
  import { cssProps } from '../actions/css-props.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'onchange' | 'placeholder'> {
    /** Image URL to show; a picked file's preview is used when omitted. */
    value?: string
    onChange?: (file: File, preview: string) => void
    onRemove?: () => void
    size?: number
    accept?: string
    /** Bytes. */
    maxSize?: number
    placeholder?: string | Snippet
    disabled?: boolean
    shape?: 'circle' | 'square'
    motion?: MotionLevel
    class?: string
  }

  let { value, onChange, onRemove, size = 120, accept = 'image/*', maxSize, placeholder, disabled = false, shape = 'circle', motion, class: className, ...rest }: Props = $props()

  const cls = makeCls('avatar-upload')
  const motionLevel = getMotionLevel(() => motion)
  let preview = $state<string | null>(null)
  let error = $state<string | null>(null)
  let dragOver = $state(false)
  let previewUrl: string | null = null
  $effect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl) })

  const displaySrc = $derived(value ?? preview)

  function process(file: File) {
    error = null
    if (maxSize && file.size > maxSize) {
      error = `File too large. Max size: ${(maxSize / (1024 * 1024)).toFixed(1)}MB`
      return
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    const url = URL.createObjectURL(file)
    previewUrl = url
    preview = url
    onChange?.(file, url)
  }

  function remove(e: MouseEvent) {
    e.stopPropagation()
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      previewUrl = null
    }
    preview = null
    error = null
    onRemove?.()
  }
</script>

{#snippet camera()}
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
    <circle cx="12" cy="13" r="4" stroke="currentColor" stroke-width="1.5" />
  </svg>
{/snippet}

<div class={cn(cls('root'), className)} data-shape={shape} data-disabled={disabled || undefined} data-motion={motionLevel()} {...rest}>
  <label
    class="ui-avatar-upload__container"
    aria-label="Upload avatar"
    aria-disabled={disabled || undefined}
    use:cssProps={{ 'inline-size': `${size}px`, 'block-size': `${size}px` }}
    ondragover={e => { e.preventDefault(); e.stopPropagation(); dragOver = true }}
    ondragleave={e => { e.preventDefault(); e.stopPropagation(); dragOver = false }}
    ondrop={e => {
      e.preventDefault()
      e.stopPropagation()
      dragOver = false
      if (disabled) return
      const file = e.dataTransfer?.files?.[0]
      if (file) process(file)
    }}
    data-drag-over={dragOver || undefined}
  >
    <input
      type="file"
      class="ui-avatar-upload__input"
      {accept}
      {disabled}
      onchange={e => {
        const file = e.currentTarget.files?.[0]
        if (file) process(file)
        // Reset so the same file can be picked again.
        e.currentTarget.value = ''
      }}
      aria-label="Upload avatar file"
    />
    {#if displaySrc}
      <img src={displaySrc} alt="Avatar" class="ui-avatar-upload__image" />
      <div class="ui-avatar-upload__overlay" aria-hidden="true"><span class="ui-avatar-upload__overlay-icon">{@render camera()}</span><span>Change</span></div>
    {:else}
      <div class="ui-avatar-upload__placeholder">{#if placeholder !== undefined && placeholder !== null}<Content value={placeholder} />{:else}{@render camera()}<span>Upload</span>{/if}</div>
    {/if}
  </label>
  {#if displaySrc && onRemove}
    <button type="button" class="ui-avatar-upload__remove" onclick={remove} aria-label="Remove avatar">
      <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 1.5l5 5m0-5l-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" /></svg>
    </button>
  {/if}
  {#if error}<div class="ui-avatar-upload__error" role="alert">{error}</div>{/if}
</div>
