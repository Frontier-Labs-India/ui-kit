<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import { cssProps } from '../actions/css-props.js'
  import { reactStyle } from '../lib/react-style.js'
  import { tokenizeLine, type CopyBlockLanguage } from '../lib/tokenize.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends HTMLAttributes<HTMLDivElement> {
    code: string
    language?: CopyBlockLanguage
    showLineNumbers?: boolean
    highlight?: number[]
    maxHeight?: string
    title?: string
    motion?: MotionLevel
    class?: string
  }

  let { code, language = 'text', showLineNumbers = true, highlight, maxHeight, title, motion, class: className, ...rest }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)
  let copied = $state(false)
  const lines = $derived(code.split('\n'))
  const highlighted = $derived(new Set(highlight ?? []))

  function fallbackCopy() {
    // Off-screen textarea positioned through the CSSOM, as React does.
    const ta = document.createElement('textarea')
    ta.value = code
    ta.style.setProperty('position', 'fixed')
    ta.style.setProperty('left', '-9999px')
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }

  async function copy() {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(code)
      else fallbackCopy()
      copied = true
      setTimeout(() => (copied = false), 2000)
    } catch {
      try {
        fallbackCopy()
        copied = true
        setTimeout(() => (copied = false), 2000)
      } catch {
        copied = false
      }
    }
  }
</script>

<div class={cn('ui-copy-block', className)} data-motion={motionLevel()} {...rest}>
  {#if title}
    <div class="ui-copy-block__header">
      <span class="ui-copy-block__title">{title}</span>
      {#if language !== 'text'}<span class="ui-copy-block__lang-badge">{language}</span>{/if}
    </div>
  {/if}
  <div class="ui-copy-block__body" use:cssProps={maxHeight ? reactStyle({ maxHeight }) : {}}>
    <button class="ui-copy-block__copy-btn" onclick={copy} aria-label="Copy code" data-copied={copied ? '' : undefined}>{copied ? 'Copied!' : 'Copy'}</button>
    <!-- Whitespace inside <pre> is content: this line is kept on one line on purpose. -->
    <pre class="ui-copy-block__pre"><code class="ui-copy-block__code">{#each lines as line, idx (idx)}<span class="ui-copy-block__line" data-highlighted={highlighted.has(idx + 1) ? '' : undefined}>{#if showLineNumbers}<span class="ui-copy-block__line-number" aria-hidden="true">{idx + 1}</span>{/if}<span class="ui-copy-block__line-content">{#each tokenizeLine(line, language) as token, i (i)}{#if token.type === 'plain'}<span>{token.value}</span>{:else}<span class={`ui-copy-block__token--${token.type}`}>{token.value}</span>{/if}{/each}{'\n'}</span></span>{/each}</code></pre>
  </div>
</div>
