<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'
  import Content from '../lib/Content.svelte'
  import { cssProps } from '../actions/css-props.js'
  import { reactStyle } from '../lib/react-style.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends HTMLAttributes<HTMLDivElement> {
    children?: Snippet
    label?: string | number | Snippet
    color?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
    position?: 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end'
    size?: number
    offset?: number
    processing?: boolean
    disabled?: boolean
    inline?: boolean
    withBorder?: boolean
    motion?: MotionLevel
    class?: string
  }

  let {
    children, label, color = 'primary', position = 'top-end', size = 10, offset = 0,
    processing = false, disabled = false, inline = false, withBorder = false, motion,
    class: className, ...rest
  }: Props = $props()

  const cls = makeCls('indicator')
  const motionLevel = getMotionLevel(() => motion)
  const hasLabel = $derived(label !== undefined && label !== null)

  // Transcribed from React's dotStyle object verbatim, then serialised by
  // React's rules — the undefined sizes when labelled are skipped, as React skips them.
  const dotStyle = $derived(reactStyle({
    inlineSize: hasLabel ? undefined : `${size}px`,
    blockSize: hasLabel ? undefined : `${size}px`,
    ...(offset !== 0 && position === 'top-end' ? { marginInlineEnd: `${offset}px`, marginBlockStart: `${offset}px` } : {}),
    ...(offset !== 0 && position === 'top-start' ? { marginInlineStart: `${offset}px`, marginBlockStart: `${offset}px` } : {}),
    ...(offset !== 0 && position === 'bottom-end' ? { marginInlineEnd: `${offset}px`, marginBlockEnd: `${offset}px` } : {}),
    ...(offset !== 0 && position === 'bottom-start' ? { marginInlineStart: `${offset}px`, marginBlockEnd: `${offset}px` } : {}),
  }))
</script>

<div
  class={cn(cls('root'), className)}
  data-color={color}
  data-position={position}
  data-motion={motionLevel()}
  data-inline={inline || undefined}
  data-disabled={disabled || undefined}
  {...rest}
>
  <span
    class="ui-indicator__dot"
    data-processing={processing || undefined}
    data-bordered={withBorder || undefined}
    data-has-label={hasLabel || undefined}
    use:cssProps={dotStyle}
    aria-hidden="true"
  >{#if hasLabel}<Content value={label} />{/if}</span>
  {#if children}{@render children()}{/if}
</div>
