<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { makeCls, cn } from './cls.js'
  import Content from './Content.svelte'

  interface Props extends HTMLAttributes<HTMLDivElement> {
    ref?: HTMLDivElement | null
    src?: string
    alt?: string
    name?: string
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    status?: 'online' | 'offline' | 'away' | 'busy'
    icon?: string | Snippet
    class?: string
  }

  // Avatar's markup, rendered by Avatar itself or, for registered avatars, by AvatarGroup.
  let { src, alt, name, size = 'md', status, icon, class: className, ref = $bindable(null), ...rest }: Props = $props()

  const cls = makeCls('avatar')
  let imgError = $state(false)
  const showImage = $derived(src && !imgError)

  // Verbatim from React, including its throw for a whitespace-only name.
  function getInitials(value: string): string {
    const parts = value.trim().split(/\s+/)
    if (parts.length === 1) return parts[0][0].toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
</script>

<div
  bind:this={ref}
  class={cn(cls('root'), className)}
  data-size={size}
  role={alt && !showImage ? 'img' : undefined}
  aria-label={alt && !showImage ? alt : undefined}
  {...rest}
>{#if showImage}<img class="ui-avatar__image" {src} alt={alt || ''} onerror={() => { imgError = true }} />{:else if icon}<span class="ui-avatar__icon"><Content value={icon} /></span>{:else if name}<span class="ui-avatar__initials">{getInitials(name)}</span>{/if}{#if status}<span class="ui-avatar__status" data-status={status} aria-hidden="true"></span>{/if}</div>
