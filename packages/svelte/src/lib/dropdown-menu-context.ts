/* State DropdownMenu shares with its parts (COMPONENT-API.md rule 3), the twin
 * of React's DropdownMenuContext. Every value is read through a getter, so a
 * part created once still follows the menu. */
import { getContext, setContext } from 'svelte'
import type { TriggerProps } from './trigger-props.js'

export interface DropdownMenuContext {
  readonly menuId: string
  readonly isOpen: boolean
  readonly placement: string
  readonly motionLevel: number
  readonly x: number
  readonly y: number
  /** Props for the trigger element, including the attachment that records it. */
  readonly triggerProps: TriggerProps
  toggle(): void
  close(): void
  /** The panel's outer element and menu element, for positioning, outside clicks and keyboard focus. */
  root: HTMLDivElement | null
  menu: HTMLDivElement | null
  onMenuKeyDown(e: KeyboardEvent): void
}

const KEY = Symbol('ui-kit.dropdown-menu')

export function setDropdownMenuContext(ctx: DropdownMenuContext): void {
  setContext(KEY, ctx)
}

/** The enclosing menu, or null: React's parts also render outside one, with no menu to act on. */
export function getDropdownMenuContext(): DropdownMenuContext | null {
  return getContext<DropdownMenuContext | undefined>(KEY) ?? null
}
