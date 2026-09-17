<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import { portal } from '../actions/portal.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    /** Controls whether the drawer is visible. */
    open: boolean
    /** Callback fired when the drawer requests to close (overlay click, Escape key). */
    onClose: () => void
    /** Which edge the drawer slides in from. */
    side?: 'left' | 'right' | 'top' | 'bottom'
    /** Width (left/right) or height (top/bottom) of the drawer panel. */
    size?: 'sm' | 'md' | 'lg' | 'full'
    /** Show a semi-transparent backdrop behind the drawer. */
    overlay?: boolean
    /** Content rendered inside the drawer body. */
    children?: Snippet
    /** Animation intensity override (0=instant, 1=CSS, 2=spring, 3=full physics). */
    motion?: MotionLevel
    class?: string
  }

  let {
    open,
    onClose,
    side = 'left',
    size = 'md',
    overlay = true,
    children,
    motion,
    class: className,
    ref = $bindable(null),
    ...rest
  }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)

  // React registers this unconditionally and checks `open` inside the handler.
  // The cleanup is what the two leak tests exist for: a portal that appends on
  // open and a listener that is never removed both pass every visible assertion.
  $effect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  })
</script>

{#if open}
  <div use:portal class={cn('ui-drawer', className)} bind:this={ref} {...rest}>
    {#if overlay}
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="ui-drawer__overlay"
        data-motion={motionLevel()}
        onclick={onClose}
        aria-hidden="true"
      ></div>
    {/if}
    <div
      class="ui-drawer__panel"
      data-side={side}
      data-size={size}
      data-motion={motionLevel()}
    >
      <div class="ui-drawer__body">
        {#if children}{@render children()}{/if}
      </div>
    </div>
  </div>
{/if}
