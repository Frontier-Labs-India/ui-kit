<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'
  import Content from '../lib/Content.svelte'
  import Icon from '../lib/Icon.svelte'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'onchange' | 'onerror'> {
    name: string
    accept?: string
    multiple?: boolean
    /** Bytes per file. */
    maxSize?: number
    maxFiles?: number
    onChange?: (files: File[]) => void
    onError?: (error: string) => void
    label?: string | Snippet
    description?: string
    error?: string
    disabled?: boolean
    showPreview?: boolean
    motion?: MotionLevel
    class?: string
  }

  let {
    name, accept, multiple = false, maxSize, maxFiles, onChange, onError, label, description, error, disabled = false,
    showPreview = true, motion, class: className, ...rest
  }: Props = $props()

  function formatFileSize(bytes: number) {
    if (bytes === 0) return '0 B'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }
  function matchesAccept(file: File, pattern: string) {
    if (!pattern) return true
    return pattern.split(',').map(p => p.trim()).some(p => {
      if (p.startsWith('.')) return file.name.toLowerCase().endsWith(p.toLowerCase())
      if (p.endsWith('/*')) return file.type.startsWith(p.slice(0, -2) + '/')
      return file.type === p
    })
  }

  const cls = makeCls('file-upload')
  const motionLevel = getMotionLevel(() => motion)
  const uid = $props.id()
  const errorId = $derived(error ? `file-upload-${uid}-error` : undefined)
  let input = $state<HTMLInputElement | null>(null)
  let files = $state<File[]>([])
  let dragOver = $state(false)

  /* Keeps what fits under maxFiles, then refuses the whole batch on the first
   * file of the wrong type or size, reporting why — as React does. */
  function validate(incoming: File[]): File[] | null {
    if (maxFiles !== undefined && files.length + incoming.length > maxFiles) {
      const remaining = maxFiles - files.length
      if (remaining <= 0) {
        onError?.(`Maximum ${maxFiles} file${maxFiles === 1 ? '' : 's'} already selected`)
        return null
      }
      incoming = incoming.slice(0, remaining)
    }
    for (const file of incoming) {
      if (accept && !matchesAccept(file, accept)) {
        onError?.(`File type not accepted: ${file.name}`)
        return null
      }
      if (maxSize !== undefined && file.size > maxSize) {
        onError?.(`File too large: ${file.name} (${formatFileSize(file.size)})`)
        return null
      }
    }
    return incoming
  }

  function handleFiles(incoming: File[]) {
    const ok = validate(incoming)
    if (ok === null) return
    files = ok
    onChange?.(ok)
  }

  function remove(index: number) {
    files = files.filter((_, i) => i !== index)
    onChange?.(files)
  }

  // Object URLs for image previews: reused per file, revoked when a file leaves or on destroy.
  let urls = new Map<File, string>()
  const previews = $derived.by(() => {
    const next = new Map<File, string>()
    const result = files.map(file => {
      const isImage = file.type.startsWith('image/')
      let url: string | null = null
      if (isImage) {
        url = urls.get(file) ?? URL.createObjectURL(file)
        next.set(file, url)
      }
      return { file, isImage, url }
    })
    for (const [file, url] of urls) if (!next.has(file)) URL.revokeObjectURL(url)
    urls = next
    return result
  })
  $effect(() => () => {
    for (const url of urls.values()) URL.revokeObjectURL(url)
    urls.clear()
  })

  const stop = (e: DragEvent) => { e.preventDefault(); e.stopPropagation() }
</script>

<div class={cn(cls('root'), className)} data-motion={motionLevel()} data-disabled={disabled ? '' : undefined} data-dragover={dragOver ? '' : undefined} data-invalid={error ? '' : undefined} {...rest}>
  {#if label}<span class="ui-file-upload__label"><Content value={label} /></span>{/if}
  <input
    bind:this={input}
    type="file"
    class="ui-file-upload__input"
    {name}
    {accept}
    {multiple}
    {disabled}
    onchange={e => {
      const list = e.currentTarget.files
      if (!list) return
      handleFiles(Array.from(list))
      // Reset so the same file can be picked again.
      e.currentTarget.value = ''
    }}
    tabindex={-1}
    aria-hidden="true"
  />
  <div
    class="ui-file-upload__dropzone"
    role="button"
    tabindex={disabled ? -1 : 0}
    aria-label={`Upload files${accept ? ` (${accept})` : ''}`}
    onclick={() => { if (!disabled) input?.click() }}
    onkeydown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!disabled) input?.click() } }}
    ondragenter={e => { stop(e); dragOver = true }}
    ondragover={e => { stop(e); dragOver = true }}
    ondragleave={e => { stop(e); dragOver = false }}
    ondrop={e => {
      stop(e)
      dragOver = false
      const dropped = e.dataTransfer?.files
      if (dropped) handleFiles(Array.from(dropped))
    }}
  >
    <span class="ui-file-upload__dropzone-icon" aria-hidden="true"><Icon name="upload" size="lg" /></span>
    <span class="ui-file-upload__dropzone-text">{#if description}{description}{:else}Drag files here or <span class="ui-file-upload__dropzone-browse">browse</span>{/if}</span>
  </div>
  {#if files.length > 0}
    <div class="ui-file-upload__files" role="list" aria-label="Selected files">
      {#each previews as { file, isImage, url }, index (`${file.name}-${index}`)}
        <div class="ui-file-upload__file" role="listitem">
          {#if showPreview && isImage && url}
            <img class="ui-file-upload__thumbnail" src={url} alt={`Preview of ${file.name}`} />
          {:else if showPreview}
            <span class="ui-file-upload__file-icon" aria-hidden="true"><Icon name="file" size="md" /></span>
          {/if}
          <div class="ui-file-upload__file-info">
            <div class="ui-file-upload__file-name">{file.name}</div>
            <div class="ui-file-upload__file-size">{formatFileSize(file.size)}</div>
          </div>
          <button type="button" class="ui-file-upload__remove" onclick={() => remove(index)} aria-label={`Remove ${file.name}`}><Icon name="x" size="sm" /></button>
        </div>
      {/each}
    </div>
  {/if}
  {#if error}<span id={errorId} class="ui-file-upload__error" role="alert">{error}</span>{/if}
</div>
