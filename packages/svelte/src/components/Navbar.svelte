<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import Content from '../lib/Content.svelte'
  import { cssProps } from '../actions/css-props.js'
  import { mergeStyles, type StyleInput } from '../lib/react-style.js'

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'style'> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLElement | null
    logo?: string | Snippet
    children?: Snippet
    actions?: string | Snippet
    sticky?: boolean
    bordered?: boolean
    transparent?: boolean
    height?: number
    style?: StyleInput
    class?: string
  }

  let { logo, children, actions, sticky = true, bordered = true, transparent = false, height = 56, class: className, style, ref = $bindable(null), ...rest }: Props = $props()

  let mobileOpen = $state(false)
  // Height variable first, caller's style after — React's spread order.
  const styles = $derived(mergeStyles({ '--navbar-height': `${height}px` }, style))
</script>

<header
  class={cn('ui-navbar', className)}
  data-sticky={String(sticky)}
  data-bordered={String(bordered)}
  data-transparent={transparent ? 'true' : undefined}
  data-mobile-open={String(mobileOpen)}
  use:cssProps={styles}
  bind:this={ref}
  {...rest}
>
  {#if logo}<div class="ui-navbar__logo"><Content value={logo} /></div>{/if}
  {#if children}<nav class="ui-navbar__nav">{@render children()}</nav>{/if}
  {#if actions}<div class="ui-navbar__actions"><Content value={actions} /></div>{/if}
  {#if children}
    <button type="button" class="ui-navbar__hamburger" aria-label="Toggle menu" aria-expanded={String(mobileOpen) as 'true' | 'false'} onclick={() => (mobileOpen = !mobileOpen)}>
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M3 5H15M3 9H15M3 13H15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" /></svg>
    </button>
    <!-- Children render twice, as in React: desktop nav and mobile nav. -->
    <nav class="ui-navbar__mobile-nav" aria-label="Mobile navigation">{@render children()}</nav>
  {/if}
</header>
