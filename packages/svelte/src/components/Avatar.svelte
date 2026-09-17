<script lang="ts">
  import { onDestroy, type Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import AvatarBase from '../lib/AvatarBase.svelte'
  import { getAvatarRegistry } from '../lib/avatar-group-context.js'

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /** The element React's `ref` receives, also inside an AvatarGroup. Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    src?: string
    alt?: string
    name?: string
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    status?: 'online' | 'offline' | 'away' | 'busy'
    icon?: string | Snippet
    class?: string
  }

  let { ref = $bindable(null), ...props }: Props = $props()

  // Inside an AvatarGroup the group renders this avatar (COMPONENT-API.md rule 2).
  // Registered during initialisation, so server rendering sees it too.
  const registry = getAvatarRegistry()
  if (registry) {
    onDestroy(registry.register({
      get props() { return props },
      get ref() { return ref },
      set ref(el) { ref = el },
    }))
  }
</script>

{#if !registry}<AvatarBase {...props} bind:ref />{/if}
