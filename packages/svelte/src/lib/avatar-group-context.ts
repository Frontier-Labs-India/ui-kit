/* AvatarGroup's registry (COMPONENT-API.md rule 2). React clones each child
 * with the group's size and renders them reversed; here each Avatar registers
 * its props and renders nothing, and the group renders the list. */
import { getContext, setContext } from 'svelte'

export interface AvatarEntry {
  readonly props: Record<string, unknown>
  /** The element rendered for this Avatar, passed back to its `ref`. */
  ref: HTMLDivElement | null
}

export interface AvatarRegistry {
  register(entry: AvatarEntry): () => void
}

const KEY = Symbol('ui-kit.avatar-group')

export function setAvatarRegistry(registry: AvatarRegistry): void {
  setContext(KEY, registry)
}

export function getAvatarRegistry(): AvatarRegistry | null {
  return getContext<AvatarRegistry | undefined>(KEY) ?? null
}
