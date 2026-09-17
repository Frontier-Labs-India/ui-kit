<script lang="ts" module>
  import type { Snippet } from 'svelte'

  export interface MenuItem {
    type?: 'item' | 'separator' | 'label'
    label?: string | Snippet
    icon?: string | Snippet
    shortcut?: string
    disabled?: boolean
    danger?: boolean
    onClick?: () => void
  }
</script>

<script lang="ts">
  import { captureElement, type TriggerProps } from '../lib/trigger-props.js'
  import { setDropdownMenuContext, type DropdownMenuContext } from '../lib/dropdown-menu-context.js'
  import DropdownMenuPanel from '../lib/DropdownMenuPanel.svelte'
  import DropdownMenuItem from './DropdownMenuItem.svelte'
  import DropdownMenuSeparator from './DropdownMenuSeparator.svelte'
  import DropdownMenuLabel from './DropdownMenuLabel.svelte'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import { useAnchorPosition } from '../runes/anchor-position.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props {
    /** The trigger element (React's DropdownMenu takes no ref). Read it with `bind:ref`. */
    ref?: Element | null
    /** Declarative API: the menu's entries. Omit to compose DropdownMenuTrigger and DropdownMenuContent. */
    items?: MenuItem[]
    /**
     * With `items`, the trigger: spread the props onto its element (`<button {...props}>`).
     * Without, the composed parts.
     */
    children: Snippet<[TriggerProps]> | Snippet
    placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'
    open?: boolean
    onOpenChange?: (open: boolean) => void
    motion?: MotionLevel
  }

  let { items, children, placement = 'bottom-start', open: controlledOpen, onOpenChange, motion, ref = $bindable(null) }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)
  const uid = $props.id()
  const menuId = `dropdown-menu-${uid}`

  let internalOpen = $state(false)
  const isOpen = $derived(controlledOpen ?? internalOpen)
  let trigger = $state<Element | null>(null)
  let root = $state<HTMLDivElement | null>(null)
  let menu = $state<HTMLDivElement | null>(null)

  const position = useAnchorPosition(() => trigger, () => root, () => ({
    placement: placement.startsWith('top') ? 'top' : 'bottom', offset: 4, enabled: isOpen,
  }))

  function setOpen(next: boolean) {
    if (controlledOpen === undefined) internalOpen = next
    onOpenChange?.(next)
  }

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

  // Arrow keys, Home/End move focus over enabled items; Enter/Space click the focused one, as in React.
  function onMenuKeyDown(e: KeyboardEvent) {
    const enabled = menu
      ? [...menu.querySelectorAll<HTMLElement>('[role="menuitem"]')].filter(el => el.getAttribute('aria-disabled') !== 'true')
      : []
    if (enabled.length === 0) return
    const current = enabled.indexOf(document.activeElement as HTMLElement)
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); enabled[current + 1 >= enabled.length ? 0 : current + 1].focus(); break
      case 'ArrowUp': e.preventDefault(); enabled[current - 1 < 0 ? enabled.length - 1 : current - 1].focus(); break
      case 'Home': e.preventDefault(); enabled[0].focus(); break
      case 'End': e.preventDefault(); enabled[enabled.length - 1].focus(); break
      case 'Enter':
      case ' ': {
        e.preventDefault()
        const focused = document.activeElement as HTMLElement
        if (focused.getAttribute('aria-disabled') !== 'true') focused.click()
        break
      }
    }
  }

  // React clones the trigger with these; see COMPONENT-API.md rule 1.
  const capture = captureElement(el => { trigger = el; ref = el })
  const triggerProps = $derived({
    ...capture,
    'aria-expanded': isOpen ? 'true' : 'false',
    'aria-haspopup': 'menu',
    'aria-controls': isOpen ? menuId : undefined,
    onclick: () => setOpen(!isOpen),
  })

  const ctx: DropdownMenuContext = {
    menuId,
    get isOpen() { return isOpen },
    get placement() { return placement },
    get motionLevel() { return motionLevel() },
    get x() { return position.x },
    get y() { return position.y },
    get triggerProps() { return triggerProps },
    toggle: () => setOpen(!isOpen),
    close: () => setOpen(false),
    get root() { return root },
    set root(el) { root = el },
    get menu() { return menu },
    set menu(el) { menu = el },
    onMenuKeyDown,
  }
  setDropdownMenuContext(ctx)
</script>

<!-- One line: line breaks here would be text nodes React does not render. -->
{#if items}{@render (children as Snippet<[TriggerProps]>)(triggerProps)}{#if isOpen}<DropdownMenuPanel {ctx}>{#each items as item, index (index)}{#if item.type === 'separator'}<DropdownMenuSeparator />{:else if item.type === 'label'}<DropdownMenuLabel children={item.label} />{:else}<DropdownMenuItem icon={item.icon} shortcut={item.shortcut} disabled={item.disabled} danger={item.danger} onClick={item.onClick} children={item.label} />{/if}{/each}</DropdownMenuPanel>{/if}{:else}{@render (children as Snippet)()}{/if}
