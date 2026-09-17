<script lang="ts">
  import type { Snippet } from 'svelte'
  import { cn } from '../lib/cls.js'
  import Content from '../lib/Content.svelte'
  import { cssProps } from '../actions/css-props.js'
  import { reactStyle } from '../lib/react-style.js'
  import { captureElement, type TriggerProps } from '../lib/trigger-props.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import { useAnchorPosition } from '../runes/anchor-position.svelte.js'
  import { useFocusTrap } from '../runes/focus-trap.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props {
    /** The caller's trigger element (React's Popover takes no ref). Read it with `bind:ref`. */
    ref?: Element | null
    content: string | Snippet
    /** The trigger. Spread the props onto its element: `<button {...props}>`. */
    children: Snippet<[TriggerProps]>
    open?: boolean
    defaultOpen?: boolean
    onOpenChange?: (open: boolean) => void
    placement?: 'top' | 'bottom' | 'left' | 'right'
    offset?: number
    arrow?: boolean
    modal?: boolean
    class?: string
    motion?: MotionLevel
    'aria-label'?: string
  }

  let {
    content, children, open: controlledOpen, defaultOpen = false, onOpenChange, placement = 'bottom', offset = 8,
    arrow = true, modal = false, class: className, motion, 'aria-label': ariaLabel, ref = $bindable(null),
  }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)
  const uid = $props.id()
  const popoverId = `popover-${uid}`

  // svelte-ignore state_referenced_locally
  let internalOpen = $state(defaultOpen)
  const isOpen = $derived(controlledOpen ?? internalOpen)

  let trigger = $state<Element | null>(null)
  let root = $state<HTMLDivElement | null>(null)
  let panel = $state<HTMLDivElement | null>(null)

  const position = useAnchorPosition(() => trigger, () => root, () => ({ placement, offset, enabled: isOpen }))
  useFocusTrap(() => panel, () => ({ active: isOpen && modal, returnFocus: true, initialFocus: 'first' }))

  function setOpen(next: boolean) {
    if (controlledOpen === undefined) internalOpen = next
    onOpenChange?.(next)
  }

  // Mousedown outside both the trigger and the popover closes it, as in React.
  $effect(() => {
    if (!isOpen) return
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (root && !root.contains(target) && trigger && !trigger.contains(target)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  })

  // React clones the trigger with these; see COMPONENT-API.md rule 1.
  const capture = captureElement(el => { trigger = el; ref = el })
  const triggerProps = $derived({
    ...capture,
    'aria-expanded': isOpen ? 'true' : 'false',
    'aria-haspopup': 'dialog',
    'aria-controls': isOpen ? popoverId : undefined,
    onclick: () => setOpen(!isOpen),
  })
</script>

<!-- One line: a line break here would be a text node React does not render, showing as a space
     after the trigger whenever inline content follows (the panel is out of flow). -->
{@render children(triggerProps)}{#if isOpen}<div
    bind:this={root}
    class={cn('ui-popover', className)}
    data-placement={position.placement}
    data-motion={motionLevel()}
    use:cssProps={reactStyle({ position: 'fixed', left: `${position.x}px`, top: `${position.y}px` })}
  ><div bind:this={panel} class="ui-popover__panel" id={popoverId} role="dialog" aria-label={ariaLabel || 'Popover'} tabindex="-1"><Content value={content} /></div>{#if arrow}<div class="ui-popover__arrow"></div>{/if}</div>{/if}
