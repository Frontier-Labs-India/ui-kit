<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'
  import { cssProps } from '../actions/css-props.js'
  import { mergeStyles, type StyleInput } from '../lib/react-style.js'

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'style'> {
    children?: Snippet
    columns?: 1 | 2 | 3 | 4 | 5 | 6
    gap?: 'sm' | 'md' | 'lg'
    minChildWidth?: string
    style?: StyleInput
    class?: string
  }

  let { columns = 3, gap = 'md', minChildWidth, children, class: className, style, ...rest }: Props = $props()

  const cls = makeCls('card-grid')
  const styles = $derived(mergeStyles(style, minChildWidth ? { '--card-grid-min-child-width': minChildWidth } : null))
</script>

<div class={cn(cls('root'), className)} data-columns={columns} data-gap={gap} use:cssProps={styles} {...rest}>
  {#if children}{@render children()}{/if}
</div>
