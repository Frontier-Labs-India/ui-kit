<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLButtonAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import { cssProps } from '../actions/css-props.js'
  import { mergeStyles, type StyleInput } from '../lib/react-style.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends Omit<HTMLButtonAttributes, 'style'> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLButtonElement | null
    shimmerColor?: string
    children?: Snippet
    size?: 'sm' | 'md' | 'lg'
    motion?: MotionLevel
    style?: StyleInput
    class?: string
  }

  let { shimmerColor, children, size = 'md', motion, class: className, style, disabled, ref = $bindable(null), ...rest }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)
  const styles = $derived(mergeStyles(style, shimmerColor ? { '--shimmer-button-color': shimmerColor } : null))
</script>

<button class={cn('ui-shimmer-button', className)} data-size={size} data-motion={motionLevel()} {disabled} use:cssProps={styles} bind:this={ref} {...rest}>{#if children}{@render children()}{/if}</button>
