<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import Self from './Skeleton.svelte'
  import { makeCls, cn } from '../lib/cls.js'
  import { cssProps } from '../actions/css-props.js'
  import { mergeStyles, reactStyle, type StyleInput } from '../lib/react-style.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'style'> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
    width?: string | number
    height?: string | number
    lines?: number
    lineHeight?: string | number
    lineGap?: string | number
    animate?: boolean
    animation?: 'shimmer' | 'pulse' | 'wave'
    radius?: string | number
    count?: number
    direction?: 'row' | 'column'
    speed?: 'slow' | 'normal' | 'fast'
    motion?: MotionLevel
    style?: StyleInput
    class?: string
  }

  let {
    variant = 'text', width, height, lines, lineHeight, lineGap, animate = true, animation = 'shimmer',
    radius, count, direction = 'row', speed = 'normal', motion, class: className, style, ref = $bindable(null), ...rest
  }: Props = $props()

  const cls = makeCls('skeleton')
  const motionLevel = getMotionLevel(() => motion)

  // Deterministic "random" widths for natural-looking multi-line text — same tables as React.
  function lineWidth(i: number, total: number): string | undefined {
    if (total <= 1) return undefined
    if (i === total - 1) return `${[55, 48, 62, 45, 58, 67, 52, 70, 47, 63][total % 10]}%`
    if (i === total - 2 && total > 2) return `${[82, 75, 88, 78, 85, 72, 90, 77, 83, 70][total % 10]}%`
    return undefined
  }
  // Skeleton's own px rule: numbers become px regardless of property, unlike React's style rule.
  const px = (v: string | number) => (typeof v === 'number' ? `${v}px` : v)

  const styles = $derived(mergeStyles(style, {
    ...(width != null ? { inlineSize: px(width) } : {}),
    ...(height != null ? { blockSize: px(height) } : {}),
    ...(radius != null ? { borderRadius: px(radius) } : {}),
    ...(lineHeight != null ? { '--skeleton-line-height': px(lineHeight) } : {}),
    ...(lineGap != null ? { '--skeleton-line-gap': px(lineGap) } : {}),
  }))
  const multiLine = $derived(variant === 'text' && lines != null && lines > 0)
</script>

{#if count != null && count > 1}
  <div class="ui-skeleton__count-wrapper" data-direction={direction} aria-hidden="true">
    {#each Array.from({ length: count }) as _, i (i)}
      <Self {variant} {width} {height} {lines} {lineHeight} {lineGap} {animate} {animation} {radius} {speed} {motion} class={className} {style} />
    {/each}
  </div>
{:else if multiLine}
  <div
    class={cn(cls('root'), className)}
    data-variant={variant}
    data-animate={animate}
    data-animation={animation}
    data-motion={motionLevel()}
    data-speed={speed}
    data-lines=""
    aria-hidden="true"
    use:cssProps={styles}
    bind:this={ref}
    {...rest}
  >
    {#each Array.from({ length: lines! }) as _, i (i)}
      {@const w = lineWidth(i, lines!)}
      <span class="ui-skeleton__line" use:cssProps={w ? reactStyle({ inlineSize: w }) : {}}></span>
    {/each}
  </div>
{:else}
  <div
    class={cn(cls('root'), className)}
    data-variant={variant}
    data-animate={animate}
    data-animation={animation}
    data-motion={motionLevel()}
    data-speed={speed}
    aria-hidden="true"
    use:cssProps={styles}
    bind:this={ref}
    {...rest}
  ></div>
{/if}
