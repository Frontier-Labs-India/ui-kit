<script module lang="ts">
  export type ToolbarAction =
    | 'bold'
    | 'italic'
    | 'underline'
    | 'strikethrough'
    | 'heading'
    | 'bulletList'
    | 'orderedList'
    | 'blockquote'
    | 'code'
    | 'link'
    | 'clearFormatting'
</script>

<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'
  import { cssProps } from '../actions/css-props.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import { sanitize } from '../vendor/core/utils/sanitize.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'onchange' | 'placeholder'> {
    /** HTML. Sanitized before it is shown (React writes it unsanitized — see below). */
    value?: string
    defaultValue?: string
    /** Receives sanitized HTML ('' when empty). */
    onChange?: (html: string) => void
    placeholder?: string
    label?: string
    error?: string
    disabled?: boolean
    readOnly?: boolean
    minHeight?: string | number
    maxHeight?: string | number
    toolbar?: ToolbarAction[]
    size?: 'sm' | 'md' | 'lg'
    motion?: MotionLevel
    class?: string
  }

  const DEFAULT_TOOLBAR: ToolbarAction[] = ['bold', 'italic', 'underline', 'strikethrough', 'heading', 'bulletList', 'orderedList', 'blockquote', 'code', 'link', 'clearFormatting']

  let {
    value, defaultValue, onChange, placeholder = 'Start typing...', label, error, disabled = false, readOnly = false,
    minHeight = 120, maxHeight, toolbar = DEFAULT_TOOLBAR, size = 'md', motion, class: className, ...rest
  }: Props = $props()

  const ICONS: Record<string, string> = {
    bold: '<path d="M6 4h5a3 3 0 0 1 0 6H6V4zm0 6h6a3 3 0 0 1 0 6H6v-6z" stroke="currentColor" stroke-width="1.5" fill="none"/>',
    italic: '<path d="M7 4h6M7 16h6M10 4l-2 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
    underline: '<path d="M6 4v6a4 4 0 0 0 8 0V4M5 18h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
    strikethrough: '<path d="M5 10h10M7 4v3M13 16v-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
    h1: '<path d="M4 4v12M4 10h6M10 4v12M14 12V8l2 2 2-2v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
    h2: '<path d="M4 4v12M4 10h6M10 4v12M14 8h3a1 1 0 0 1 0 3h-1l2 3h-1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
    h3: '<path d="M4 4v12M4 10h6M10 4v12M14 8h3a1 1 0 0 1 0 2.5 1 1 0 0 1 0 2.5h-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
    bulletList: '<path d="M8 5h9M8 10h9M8 15h9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="4" cy="5" r="1" fill="currentColor"/><circle cx="4" cy="10" r="1" fill="currentColor"/><circle cx="4" cy="15" r="1" fill="currentColor"/>',
    orderedList: '<path d="M8 5h9M8 10h9M8 15h9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><text x="3" y="7" font-size="6" fill="currentColor" font-family="inherit">1</text><text x="3" y="12" font-size="6" fill="currentColor" font-family="inherit">2</text><text x="3" y="17" font-size="6" fill="currentColor" font-family="inherit">3</text>',
    blockquote: '<path d="M5 8h4l-1 4M11 8h4l-1 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
    code: '<path d="M7 7l-3 3 3 3M13 7l3 3-3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
    link: '<path d="M9 11l-1 1a2.5 2.5 0 0 0 3.5 3.5l1-1M11 9l1-1a2.5 2.5 0 0 0-3.5-3.5l-1 1M8 12l4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
    clearFormatting: '<path d="M5 5l10 10M8 4h5l-3 6M4 16h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  }
  const icon = (name: string) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">${ICONS[name] ?? ''}</svg>`
  const HEADING_LEVELS = ['h1', 'h2', 'h3'] as const
  const FORMAT_GROUPS: ToolbarAction[][] = [['bold', 'italic', 'underline', 'strikethrough'], ['heading'], ['bulletList', 'orderedList', 'blockquote'], ['code', 'link'], ['clearFormatting']]
  const LABELS: Record<string, string> = {
    bold: 'Bold', italic: 'Italic', underline: 'Underline', strikethrough: 'Strikethrough', bulletList: 'Bullet list',
    orderedList: 'Ordered list', blockquote: 'Blockquote', code: 'Code', link: 'Link', clearFormatting: 'Clear formatting',
  }

  function exec(command: string, arg?: string) {
    if (!document.execCommand(command, false, arg)) console.warn(`[RichTextEditor] execCommand('${command}') returned false`)
  }
  const queryActive = (command: string) => { try { return document.queryCommandState(command) } catch { return false } }
  const queryBlock = () => { try { return (document.queryCommandValue('formatBlock') || '').toLowerCase() } catch { return '' } }

  const cls = makeCls('rich-text-editor')
  const motionLevel = getMotionLevel(() => motion)
  const uid = $props.id()
  const stableId = `rich-text-editor-${uid}`
  let editor = $state<HTMLDivElement | null>(null)
  let focused = false
  let activeStates = $state<Record<string, boolean>>({})
  let headingMenuOpen = $state(false)
  let lastHtml = ''

  /* React writes `value`/`defaultValue` into innerHTML unsanitized, so a
   * caller passing stored HTML with a <script> or an onerror handler would run
   * it. Here incoming HTML goes through the same sanitize() that already
   * cleans the output. Recorded as a React security defect. */
  $effect(() => {
    if (value === undefined || !editor || focused) return
    const clean = sanitize(value)
    if (editor.innerHTML !== clean) {
      editor.innerHTML = clean
      lastHtml = clean
    }
  })

  $effect(() => {
    if (value !== undefined || !defaultValue || !editor) return
    editor.innerHTML = sanitize(defaultValue)
    lastHtml = editor.innerHTML
  })

  function updateActiveStates() {
    const block = queryBlock()
    activeStates = {
      bold: queryActive('bold'),
      italic: queryActive('italic'),
      underline: queryActive('underline'),
      strikethrough: queryActive('strikeThrough'),
      h1: block === 'h1',
      h2: block === 'h2',
      h3: block === 'h3',
      bulletList: queryActive('insertUnorderedList'),
      orderedList: queryActive('insertOrderedList'),
    }
  }

  function handleInput() {
    if (!editor) return
    const html = editor.innerHTML
    const clean = html === '<br>' || html === '<p><br></p>' || html === '' ? '' : sanitize(html)
    if (clean !== lastHtml) {
      lastHtml = clean
      onChange?.(clean)
    }
    updateActiveStates()
  }

  $effect(() => {
    const handler = () => {
      if (editor && editor.contains(document.activeElement ?? document.getSelection()?.anchorNode ?? null)) updateActiveStates()
    }
    document.addEventListener('selectionchange', handler)
    return () => document.removeEventListener('selectionchange', handler)
  })

  function handleKeyDown(e: KeyboardEvent) {
    if (readOnly || disabled || !(e.metaKey || e.ctrlKey)) return
    const command = e.key === 'b' ? 'bold' : e.key === 'i' ? 'italic' : e.key === 'u' ? 'underline' : null
    if (!command) return
    e.preventDefault()
    exec(command)
    updateActiveStates()
  }

  function run(action: ToolbarAction, sub?: string) {
    if (disabled || readOnly) return
    editor?.focus()
    switch (action) {
      case 'bold': exec('bold'); break
      case 'italic': exec('italic'); break
      case 'underline': exec('underline'); break
      case 'strikethrough': exec('strikeThrough'); break
      case 'heading': {
        const level = sub ?? 'h1'
        exec('formatBlock', queryBlock() === level ? 'p' : level)
        break
      }
      case 'bulletList': exec('insertUnorderedList'); break
      case 'orderedList': exec('insertOrderedList'); break
      case 'blockquote': exec('formatBlock', queryBlock() === 'blockquote' ? 'p' : 'blockquote'); break
      case 'code': {
        const selection = window.getSelection()
        if (selection && selection.rangeCount > 0) {
          const text = selection.getRangeAt(0).toString()
          if (text) exec('insertHTML', `<code>${text}</code>`)
        }
        break
      }
      case 'link': {
        const selected = window.getSelection()?.toString() ?? ''
        const url = prompt('Enter URL:', 'https://')
        if (url) {
          if (selected) exec('createLink', url)
          else exec('insertHTML', `<a href="${url}">${url}</a>`)
        }
        break
      }
      case 'clearFormatting': exec('removeFormat'); break
    }
    updateActiveStates()
    handleInput()
  }

  $effect(() => {
    if (!headingMenuOpen) return
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.ui-rich-text-editor__heading-group')) headingMenuOpen = false
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  })

  const size_ = (v: string | number | undefined) => (v ? (typeof v === 'number' ? `${v}px` : v) : null)
  const isMac = typeof navigator !== 'undefined' &&
    (/Mac|iPhone|iPad|iPod/i.test(navigator.platform) || (navigator as { userAgentData?: { platform?: string } }).userAgentData?.platform === 'macOS')
  const modKey = isMac ? 'Cmd' : 'Ctrl'
  const SHORTCUTS: Record<string, string> = { bold: ` (${modKey}+B)`, italic: ` (${modKey}+I)`, underline: ` (${modKey}+U)` }

  const items = $derived.by(() => {
    let prev = -1
    return toolbar.map((action, i) => {
      const group = FORMAT_GROUPS.findIndex(g => g.includes(action))
      const separator = prev !== -1 && group !== prev
      prev = group
      return { action, i, separator }
    })
  })
  const errorId = $derived(error ? `${stableId}-error` : undefined)
  const labelId = $derived(label ? `${stableId}-label` : undefined)
</script>

<div class={cn(cls('root'), className)} data-size={size} data-motion={motionLevel()} data-invalid={error ? '' : undefined} data-disabled={disabled ? '' : undefined} data-readonly={readOnly ? '' : undefined} {...rest}>
  <!-- React renders this label without `for`: the editor is named by aria-labelledby. -->
  <!-- svelte-ignore a11y_label_has_associated_control -->
  {#if label}<label id={labelId} class="ui-rich-text-editor__label">{label}</label>{/if}
  <div class="ui-rich-text-editor__wrapper">
    <div class="ui-rich-text-editor__toolbar" role="toolbar" aria-label="Formatting options">
      {#each items as { action, separator }}
        {#if separator}<span class="ui-rich-text-editor__toolbar-separator" aria-hidden="true"></span>{/if}
        {#if action === 'heading'}
          <span class="ui-rich-text-editor__heading-group">
            <button type="button" class="ui-rich-text-editor__toolbar-btn" data-active={activeStates.h1 || activeStates.h2 || activeStates.h3 ? '' : undefined}
              onclick={() => { headingMenuOpen = !headingMenuOpen }} aria-label="Heading" aria-expanded={headingMenuOpen} aria-haspopup="true" title="Heading" disabled={disabled || readOnly}
            ><span>{@html icon('h1')}</span></button>
            <div class="ui-rich-text-editor__heading-menu" role="menu" data-open={headingMenuOpen ? '' : undefined}>
              {#each HEADING_LEVELS as level (level)}
                <button type="button" role="menuitem" data-active={activeStates[level] ? '' : undefined} onclick={() => { run('heading', level); headingMenuOpen = false }}>{level.toUpperCase()}</button>
              {/each}
            </div>
          </span>
        {:else}
          <button type="button" class="ui-rich-text-editor__toolbar-btn" data-active={activeStates[action] ? '' : undefined} onclick={() => run(action)}
            aria-label={LABELS[action] ?? action} title={`${LABELS[action] ?? action}${SHORTCUTS[action] ?? ''}`} disabled={disabled || readOnly}
          ><span>{@html icon(action)}</span></button>
        {/if}
      {/each}
    </div>
    <!-- Focusable through contenteditable; React sets no tabindex. -->
    <!-- svelte-ignore a11y_interactive_supports_focus -->
    <div
      bind:this={editor}
      class="ui-rich-text-editor__editor"
      contenteditable={!disabled && !readOnly}
      role="textbox"
      aria-multiline="true"
      aria-label={label ?? 'Rich text editor'}
      aria-labelledby={labelId}
      aria-describedby={errorId}
      aria-invalid={error ? true : undefined}
      aria-readonly={readOnly || undefined}
      aria-disabled={disabled || undefined}
      data-placeholder={placeholder}
      use:cssProps={{ 'min-block-size': size_(minHeight), 'max-block-size': size_(maxHeight) }}
      oninput={handleInput}
      onkeydown={handleKeyDown}
      onfocus={() => { focused = true }}
      onblur={() => { focused = false }}
    ></div>
  </div>
  {#if error}<span id={errorId} class="ui-rich-text-editor__error" role="alert">{error}</span>{/if}
</div>
