<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { SvelteMap } from 'svelte/reactivity'
  import { makeCls, cn } from '../lib/cls.js'
  import AvatarBase from '../lib/AvatarBase.svelte'
  import { setAvatarRegistry, type AvatarEntry } from '../lib/avatar-group-context.js'

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    max?: number
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    /** Avatar parts. */
    children?: Snippet
    class?: string
  }

  let { max, size, children, class: className, ref = $bindable(null), ...rest }: Props = $props()
  const cls = makeCls('avatar-group')

  const entries = new SvelteMap<object, AvatarEntry>()
  setAvatarRegistry({
    register(entry) {
      const key = {}
      entries.set(key, entry)
      return () => entries.delete(key)
    },
  })

  const all = $derived([...entries.values()])
  const visibleCount = $derived(max !== undefined ? Math.min(max, all.length) : all.length)
  const overflowCount = $derived(all.length - visibleCount)
  // React reverses the visible children so earlier avatars stack on top.
  const shown = $derived(all.slice(0, visibleCount).reverse())
</script>

<!-- `children` first: Avatars register there and render nothing, on the server too. -->
<div bind:this={ref} class={cn(cls('root'), className)} role="group" {...rest}>{@render children?.()}{#if overflowCount > 0}<span class="ui-avatar-group__overflow" aria-label={`${overflowCount} more`}>+{overflowCount}</span>{/if}{#each shown as entry (entry)}<AvatarBase {...entry.props} {...(size ? { size } : {})} bind:ref={entry.ref} />{/each}</div>
