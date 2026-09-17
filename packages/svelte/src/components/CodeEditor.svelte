<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import { cssProps } from '../actions/css-props.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import { tokenizeLine, type CodeEditorLanguage } from '../lib/code-editor-tokenize.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'onchange' | 'placeholder'> {
    /** Bindable. Omit it for an uncontrolled editor that starts from defaultValue. */
    value?: string
    defaultValue?: string
    onChange?: (value: string) => void
    language?: CodeEditorLanguage
    readOnly?: boolean
    showLineNumbers?: boolean
    lineNumberStart?: number
    placeholder?: string
    minHeight?: string | number
    maxHeight?: string | number
    wordWrap?: boolean
    tabSize?: number
    highlightActiveLine?: boolean
    motion?: MotionLevel
    class?: string
  }

  let {
    value = $bindable(), defaultValue = '', onChange, language = 'plain', readOnly = false, showLineNumbers = true,
    lineNumberStart = 1, placeholder, minHeight, maxHeight, wordWrap = false, tabSize = 2, highlightActiveLine = true,
    motion, class: className, ...rest
  }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)
  // svelte-ignore state_referenced_locally
  let internal = $state(defaultValue)
  const code = $derived(value !== undefined ? value : internal)
  let activeLine = $state(0)
  let textarea = $state<HTMLTextAreaElement | null>(null)
  let pre = $state<HTMLPreElement | null>(null)

  // Wrapped lines cannot line up with numbers, so wordWrap hides them, as in React.
  const gutter = $derived(wordWrap ? false : showLineNumbers)
  const lines = $derived(code.split('\n'))

  function commit(next: string) {
    if (value !== undefined) value = next
    else internal = next
    onChange?.(next)
  }

  function updateActiveLine() {
    if (textarea) activeLine = textarea.value.slice(0, textarea.selectionStart).split('\n').length - 1
  }

  /* Tab indents (a multi-line selection block-wise), Shift+Tab dedents the
   * current line, Enter keeps the current indentation — writing the textarea
   * and the value together, as React does. */
  function handleKeyDown(e: KeyboardEvent & { currentTarget: EventTarget & HTMLTextAreaElement }) {
    const ta = e.currentTarget
    const { selectionStart, selectionEnd, value: text } = ta
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault()
      const spaces = ' '.repeat(tabSize)
      const selected = text.slice(selectionStart, selectionEnd)
      if (selectionStart !== selectionEnd && selected.includes('\n')) {
        const indented = selected.split('\n').map(l => spaces + l).join('\n')
        const next = text.slice(0, selectionStart) + indented + text.slice(selectionEnd)
        ta.value = next
        ta.selectionStart = selectionStart
        ta.selectionEnd = selectionStart + indented.length
        commit(next)
        return
      }
      const next = text.slice(0, selectionStart) + spaces + text.slice(selectionEnd)
      ta.value = next
      ta.selectionStart = ta.selectionEnd = selectionStart + tabSize
      commit(next)
      return
    }
    if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault()
      const lineStart = text.lastIndexOf('\n', selectionStart - 1) + 1
      const found = text.indexOf('\n', lineStart)
      const lineEnd = found === -1 ? text.length : found
      const lineText = text.substring(lineStart, lineEnd)
      const remove = Math.min(tabSize, lineText.match(/^ */)?.[0].length ?? 0)
      if (remove > 0) {
        const next = text.slice(0, lineStart) + lineText.slice(remove) + text.slice(lineEnd)
        ta.value = next
        ta.selectionStart = ta.selectionEnd = Math.max(lineStart, selectionStart - remove)
        commit(next)
      }
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      const lineStart = text.lastIndexOf('\n', selectionStart - 1) + 1
      const indent = text.slice(lineStart, selectionStart).match(/^(\s*)/)?.[1] ?? ''
      const insertion = '\n' + indent
      const next = text.slice(0, selectionStart) + insertion + text.slice(selectionEnd)
      ta.value = next
      ta.selectionStart = ta.selectionEnd = selectionStart + insertion.length
      commit(next)
    }
  }

  const size = (v: string | number | undefined) => (v ? (typeof v === 'number' ? `${v}px` : v) : null)
</script>

<div class={cn('ui-code-editor', className)} data-motion={motionLevel()} role="group" aria-label="Code editor" use:cssProps={{ 'min-block-size': size(minHeight), 'max-block-size': size(maxHeight) }} {...rest}>
  {#if gutter}
    <div class="ui-code-editor__gutter" aria-hidden="true">
      {#each lines as _, idx}<span class="ui-code-editor__line-number" data-active={highlightActiveLine && idx === activeLine ? '' : undefined}>{idx + lineNumberStart}</span>{/each}
    </div>
  {/if}
  <div class="ui-code-editor__editor">
    <!-- role="textbox" is redundant but React renders it; `autocorrect` is missing from Svelte's element typings. -->
    <!-- svelte-ignore a11y_no_redundant_roles -->
    <textarea
      bind:this={textarea}
      class="ui-code-editor__textarea"
      value={code}
      oninput={e => commit(e.currentTarget.value)}
      onkeydown={handleKeyDown}
      onscroll={() => { if (textarea && pre) { pre.scrollTop = textarea.scrollTop; pre.scrollLeft = textarea.scrollLeft } }}
      onclick={updateActiveLine}
      onkeyup={updateActiveLine}
      readonly={readOnly}
      {placeholder}
      spellcheck={false}
      autocapitalize="off"
      autocomplete="off"
      {...{ autocorrect: 'off' }}
      aria-label="Code input"
      aria-multiline="true"
      role="textbox"
      use:cssProps={{ 'tab-size': String(tabSize) }}
      data-word-wrap={wordWrap ? '' : undefined}
    ></textarea>
    <pre bind:this={pre} class="ui-code-editor__pre" aria-hidden="true" data-word-wrap={wordWrap ? '' : undefined}>{#each lines as line, idx}<span class="ui-code-editor__line" data-active={highlightActiveLine && idx === activeLine ? '' : undefined}>{#each tokenizeLine(line || ' ', language) as token}{#if token.type === 'plain'}<span>{token.value}</span>{:else}<span class={`ui-code-editor__token--${token.type}`}>{token.value}</span>{/if}{/each}{'\n'}</span>{/each}</pre>
  </div>
</div>
