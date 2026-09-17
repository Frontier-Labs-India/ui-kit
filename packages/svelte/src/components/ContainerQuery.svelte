<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import { cssProps } from '../actions/css-props.js'
  import { mergeStyles, type StyleInput } from '../lib/react-style.js'
  import { useContainerSize, type ContainerSize } from '../runes/container-size.svelte.js'

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'style'> {
    /** Receives the container's current size. React's function-as-children. */
    children?: Snippet<[ContainerSize]>
    class?: string
    style?: StyleInput
  }

  let { children, class: className, style, ...rest }: Props = $props()

  let element = $state<HTMLDivElement | null>(null)
  const size = useContainerSize(() => element)
  // React: { containerType: 'inline-size', ...style }.
  const styles = $derived(mergeStyles({ containerType: 'inline-size' }, style))
</script>

<div bind:this={element} class={cn('ui-container-query', className)} use:cssProps={styles} {...rest}>
  {#if children}{@render children(size)}{/if}
</div>
