<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import { cssProps } from '../actions/css-props.js'
  import { mergeStyles, type StyleInput } from '../lib/react-style.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'style'> {
    duration?: number
    color?: string
    size?: number
    children?: Snippet
    motion?: MotionLevel
    style?: StyleInput
    class?: string
  }

  let { duration = 5, color, size = 80, children, motion, class: className, style, ...rest }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)
  const styles = $derived(mergeStyles(style, {
    '--border-beam-duration': `${duration}s`,
    '--border-beam-size': `${size}px`,
    ...(color ? { '--border-beam-color': color } : {}),
  }))
</script>

<div class={cn('ui-border-beam', className)} data-motion={motionLevel()} use:cssProps={styles} {...rest}>
  <div class="ui-border-beam--content">{#if children}{@render children()}{/if}</div>
</div>
