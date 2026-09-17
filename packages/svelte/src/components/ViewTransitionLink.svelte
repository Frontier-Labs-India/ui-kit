<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAnchorAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import { cssProps } from '../actions/css-props.js'
  import { mergeStyles, type StyleInput } from '../lib/react-style.js'

  interface Props extends Omit<HTMLAnchorAttributes, 'style'> {
    transitionName?: string
    children?: Snippet
    style?: StyleInput
    class?: string
  }

  let { transitionName, children, class: className, style, onclick, href, ...rest }: Props = $props()

  function handleClick(e: MouseEvent & { currentTarget: EventTarget & HTMLAnchorElement }) {
    ;(onclick as ((e: MouseEvent) => void) | undefined)?.(e)
    // Use the View Transitions API when present and the caller has not already
    // handled the click; otherwise fall through to native navigation.
    if (!e.defaultPrevented && typeof document.startViewTransition === 'function') {
      e.preventDefault()
      document.startViewTransition(() => {
        if (href) window.location.href = href
      })
    }
  }

  const styles = $derived(mergeStyles(style, transitionName ? { viewTransitionName: transitionName } : null))
</script>

<a {href} class={cn('ui-view-transition-link', className)} use:cssProps={styles} onclick={handleClick} {...rest}>{#if children}{@render children()}{/if}</a>
