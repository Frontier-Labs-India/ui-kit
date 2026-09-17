<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import { cssProps } from '../actions/css-props.js'
  import { reactStyle } from '../lib/react-style.js'

  interface Props extends HTMLAttributes<HTMLSpanElement> {
    text: string
    lines?: number
    expandable?: boolean
    showTooltip?: boolean
    class?: string
  }

  let { text, lines = 1, expandable = false, showTooltip = true, class: className, ...rest }: Props = $props()
  let expanded = $state(false)
</script>

<span class={cn('ui-truncated-text', className)} data-lines={lines} title={showTooltip && !expanded ? text : undefined} {...rest}>
  <span class="ui-truncated-text__content" use:cssProps={reactStyle({ '--lines': lines })} data-expanded={expanded ? '' : undefined}>{text}</span>
  {#if expandable}
    <button class="ui-truncated-text__toggle" onclick={() => (expanded = !expanded)} aria-expanded={expanded}>{expanded ? 'Show less' : 'Show more'}</button>
  {/if}
</span>
