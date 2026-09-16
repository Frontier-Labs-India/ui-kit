<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import Content from '../lib/Content.svelte'
  import { cssProps } from '../actions/css-props.js'
  import { mergeStyles, reactStyle, type StyleInput } from '../lib/react-style.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  type Item = Snippet | string | number | boolean | null | undefined

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'style'> {
    radius?: number
    duration?: number
    reverse?: boolean
    /** The orbiting items. React takes these as an array of children and wraps
     *  each; a Svelte snippet cannot be split into children, so they are a prop. */
    items: Item[]
    motion?: MotionLevel
    style?: StyleInput
    class?: string
  }

  let { radius = 100, duration = 15, reverse = false, items, motion, class: className, style, ...rest }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)

  // React's Children.toArray drops null, undefined and booleans entirely — no
  // wrapper is rendered for them, and they do not count towards the spacing.
  const visible = $derived(items.filter(i => i != null && typeof i !== 'boolean'))
  const angleStep = $derived(360 / visible.length)

  const styles = $derived(mergeStyles(style, {
    '--orbit-radius': `${radius}px`,
    '--orbit-duration': `${duration}s`,
    '--orbit-direction': reverse ? 'reverse' : 'normal',
  }))
</script>

<div class={cn('ui-orbiting-circles', className)} data-motion={motionLevel()} use:cssProps={styles} role="presentation" {...rest}>
  {#each visible as item, i (i)}
    <div
      class="ui-orbiting-circles--item"
      use:cssProps={reactStyle({
        '--orbit-start-angle': `${i * angleStep}deg`,
        '--orbit-delay': `${-(i * (duration / visible.length))}s`,
      })}
    ><Content value={item} /></div>
  {/each}
</div>
