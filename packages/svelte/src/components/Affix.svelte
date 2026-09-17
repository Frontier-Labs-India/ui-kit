<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'
  import { cssProps } from '../actions/css-props.js'
  import { portal } from '../actions/portal.js'
  import { mergeStyles, type StyleInput } from '../lib/react-style.js'

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'style'> {
    position?: { top?: number; bottom?: number; left?: number; right?: number }
    zIndex?: number
    /** Render into document.body instead of in place. */
    withinPortal?: boolean
    /** Accepted for API parity; React's Affix does not read it either. */
    target?: HTMLElement
    children?: Snippet
    class?: string
    style?: StyleInput
  }

  let { position = { bottom: 20, right: 20 }, zIndex = 100, withinPortal = false, target: _target, children, class: className, style, ...rest }: Props = $props()

  const cls = makeCls('affix')
  const px = (n: number | undefined) => (n !== undefined ? `${n}px` : undefined)
  // React: { top?, bottom?, left?, right?, zIndex, ...style }
  const styles = $derived(mergeStyles(
    { top: px(position.top), bottom: px(position.bottom), left: px(position.left), right: px(position.right), zIndex },
    style,
  ))
  const maybePortal = (node: HTMLElement, enabled: boolean) => (enabled ? portal(node) : undefined)
</script>

<div use:maybePortal={withinPortal} class={cn(cls('root'), className)} use:cssProps={styles} {...rest}>{#if children}{@render children()}{/if}</div>
