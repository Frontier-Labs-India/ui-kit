<script lang="ts">
  import type { Snippet } from 'svelte'
  import { cssProps } from '../actions/css-props.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'
  import { useAnchorPosition } from '../runes/anchor-position.svelte.js'

  interface Props {
    /** The tooltip content to display. */
    content: string | Snippet
    /** The trigger element the tooltip attaches to. */
    children: Snippet
    /** Preferred placement relative to the trigger element. */
    placement?: 'top' | 'bottom' | 'left' | 'right'
    /** Delay in milliseconds before the tooltip appears on hover. */
    delay?: number
    /** Distance in pixels between the tooltip and the trigger element. */
    offset?: number
    /** When true, the tooltip will not appear on hover or focus. */
    disabled?: boolean
    /** Enables hover interactions within the tooltip panel. */
    interactive?: boolean
    /** Maximum width of the tooltip panel. */
    maxWidth?: number | string
    /** Animation intensity override (0=instant, 1=CSS, 2=spring, 3=full physics). */
    motion?: MotionLevel
  }

  let {
    content,
    children,
    placement = 'top',
    delay = 300,
    offset = 8,
    disabled = false,
    interactive = false,
    maxWidth,
    motion,
  }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)
  const uid = $props.id()
  const tooltipId = `tooltip-${uid}`

  let visible = $state(false)
  let trigger = $state<HTMLElement | null>(null)
  let floating = $state<HTMLElement | null>(null)
  let showTimer: ReturnType<typeof setTimeout> | null = null
  let hideTimer: ReturnType<typeof setTimeout> | null = null
  let longPressTimer: ReturnType<typeof setTimeout> | null = null

  function clearTimers() {
    if (showTimer) { clearTimeout(showTimer); showTimer = null }
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null }
    if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null }
  }

  function show() {
    if (disabled) return
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null }
    showTimer = setTimeout(() => { visible = true }, delay)
  }

  function hide() {
    if (showTimer) { clearTimeout(showTimer); showTimer = null }
    hideTimer = setTimeout(() => { visible = false }, interactive ? 100 : 0)
  }

  // Positioned by the shared rune, which calls the same framework-neutral
  // computeAnchorPosition as React's useAnchorPosition, so flip-when-off-screen
  // cannot drift between them. Only while visible, as in React.
  const position = useAnchorPosition(() => trigger, () => floating, () => ({ placement, offset, enabled: visible }))

  // Dismiss on touch outside, matching React.
  $effect(() => {
    if (!visible) return
    const onTouch = (e: TouchEvent) => {
      if (trigger && !trigger.contains(e.target as Node)) visible = false
    }
    document.addEventListener('touchstart', onTouch)
    return () => document.removeEventListener('touchstart', onTouch)
  })

  $effect(() => clearTimers)

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape' && visible) hide()
  }
  function onTouchStart() {
    if (disabled) return
    longPressTimer = setTimeout(() => { visible = true }, 500)
  }
  function onTouchEnd() {
    if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null }
  }
</script>

<!-- React attaches these handlers to the child via cloneElement, which Svelte
     has no equivalent for. The wrapper carries them instead; it is
     display:contents in the stylesheet so it adds no box. The tooltip panel
     itself — the styled part — keeps exact DOM parity with React. -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<span
  class="ui-tooltip-trigger"
  bind:this={trigger}
  aria-describedby={visible ? tooltipId : undefined}
  onmouseenter={show}
  onmouseleave={hide}
  onfocusin={show}
  onfocusout={hide}
  onkeydown={onKeyDown}
  ontouchstart={onTouchStart}
  ontouchend={onTouchEnd}
>
  {@render children()}
</span>

{#if visible}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    bind:this={floating}
    class="ui-tooltip"
    data-placement={position.placement}
    data-motion={motionLevel()}
    use:cssProps={{
      position: 'fixed',
      left: `${position.x}px`,
      top: `${position.y}px`,
      // Hyphenated CSS names, not React's camelCase: setProperty takes CSS
      // property names, and maxInlineSize would silently do nothing.
      'pointer-events': interactive ? 'auto' : null,
      'max-inline-size':
        maxWidth === undefined ? null : typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth,
    }}
    onmouseenter={interactive ? show : undefined}
    onmouseleave={interactive ? hide : undefined}
  >
    <div class="ui-tooltip__panel" role="tooltip" id={tooltipId}>
      {#if typeof content === 'function'}{@render content()}{:else}{content}{/if}
    </div>
    <div class="ui-tooltip__arrow"></div>
  </div>
{/if}
