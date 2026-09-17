<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'
  import { cssProps } from '../actions/css-props.js'
  import { mergeStyles, type StyleInput } from '../lib/react-style.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  type Variant = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body' | 'body-sm' | 'caption' | 'code' | 'overline'

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'style'> {
    variant?: Variant
    color?: 'primary' | 'secondary' | 'tertiary' | 'brand' | 'success' | 'warning' | 'danger'
    weight?: 300 | 400 | 500 | 600 | 700 | 800
    align?: 'start' | 'center' | 'end'
    truncate?: boolean | number
    /** Element to render. React also accepts a component here; Svelte takes a tag name. */
    as?: string
    motion?: MotionLevel
    /** A CSS string or a React-style object; applied through setProperty, so CSP-safe. */
    style?: StyleInput
    class?: string
    children?: Snippet
  }

  const VARIANT_ELEMENTS: Record<string, string> = {
    h1: 'h1', h2: 'h2', h3: 'h3', h4: 'h4', h5: 'h5', h6: 'h6',
    body: 'p', 'body-sm': 'p', caption: 'span', code: 'code', overline: 'span',
  }

  let {
    variant = 'body', color, weight, align, truncate, as, motion, children,
    class: className, style, ...rest
  }: Props = $props()

  const cls = makeCls('typography')
  const motionLevel = getMotionLevel(() => motion)

  const tag = $derived(as || VARIANT_ELEMENTS[variant] || 'span')
  const isMultiLine = $derived(typeof truncate === 'number' && truncate > 1)
  const truncVal = $derived(truncate === true ? '1' : typeof truncate === 'number' ? String(truncate) : undefined)
  const styles = $derived(mergeStyles(
    style,
    weight !== undefined ? { fontWeight: weight } : null,
    isMultiLine ? { WebkitLineClamp: truncate as number } : null,
  ))
</script>

<svelte:element
  this={tag}
  class={cn(cls('root'), className)}
  data-variant={variant}
  data-color={color}
  data-align={align}
  data-motion={motionLevel()}
  data-truncate-lines={isMultiLine ? '' : undefined}
  data-truncate={!isMultiLine && truncVal ? truncVal : undefined}
  use:cssProps={styles}
  {...rest}
>{#if children}{@render children()}{/if}</svelte:element>
