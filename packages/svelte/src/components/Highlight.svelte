<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import { cssProps } from '../actions/css-props.js'
  import { mergeStyles, type StyleInput } from '../lib/react-style.js'

  interface Props extends Omit<HTMLAttributes<HTMLSpanElement>, 'style'> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLSpanElement | null
    /** The text to search. React takes this as `children`; a Svelte snippet's
     *  text cannot be read back, so it is a prop here. */
    text: string
    highlight: string | string[]
    color?: string
    caseSensitive?: boolean
    highlightClassName?: string
    style?: StyleInput
    class?: string
  }

  let { text, highlight, color, caseSensitive = false, highlightClassName, class: className, style, ref = $bindable(null), ...rest }: Props = $props()

  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  const chunks = $derived.by(() => {
    const terms = (Array.isArray(highlight) ? highlight : [highlight]).filter(t => t.length > 0)
    if (terms.length === 0) return [{ text, highlighted: false }]
    const regex = new RegExp(`(${terms.map(escapeRegExp).join('|')})`, caseSensitive ? 'g' : 'gi')
    return text
      .split(regex)
      .filter(p => p.length > 0)
      .map(part => ({
        text: part,
        highlighted: terms.some(t => (caseSensitive ? part === t : part.toLowerCase() === t.toLowerCase())),
      }))
  })

  const styles = $derived(mergeStyles(style, color ? { '--ui-highlight-color': color } : null))
</script>

<span class={cn('ui-highlight', className)} use:cssProps={styles} bind:this={ref} {...rest}>
  {#each chunks as chunk, i (i)}{#if chunk.highlighted}<mark class={highlightClassName}>{chunk.text}</mark>{:else}<span>{chunk.text}</span>{/if}{/each}
</span>
