<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import { cssProps } from '../actions/css-props.js'
  import { mergeStyles, type StyleInput } from '../lib/react-style.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'style'> {
    collapsed?: boolean
    onCollapse?: (collapsed: boolean) => void
    width?: number | string
    collapsedWidth?: number | string
    position?: 'left' | 'right'
    children?: Snippet
    motion?: MotionLevel
    style?: StyleInput
    class?: string
  }

  let {
    collapsed = false, onCollapse, width = 240, collapsedWidth = 64, position = 'left', children, motion,
    class: className, style, ...rest
  }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)
  const px = (v: number | string) => (typeof v === 'number' ? `${v}px` : v)
  // Width variables first, then the caller's style — React spreads style last, so it wins.
  const styles = $derived(mergeStyles({ '--sidebar-width': px(width), '--sidebar-collapsed-width': px(collapsedWidth) }, style))
</script>

<aside
  class={cn('ui-sidebar', className)}
  data-collapsed={String(collapsed)}
  data-position={position}
  data-motion={motionLevel()}
  use:cssProps={styles}
  {...rest}
>
  <button type="button" class="ui-sidebar__toggle" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} onclick={() => onCollapse?.(!collapsed)}>
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d={collapsed ? 'M4.5 2.5L7.5 6L4.5 9.5' : 'M7.5 2.5L4.5 6L7.5 9.5'} stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  </button>
  {#if children}{@render children()}{/if}
</aside>
