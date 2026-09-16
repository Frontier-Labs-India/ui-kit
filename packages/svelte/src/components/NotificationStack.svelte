<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import Content from '../lib/Content.svelte'
  import { fmtRelative } from '../vendor/core/utils/format.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  export interface Notification {
    id: string
    title: string
    description?: string
    timestamp: number | Date
    variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
    icon?: string | Snippet
    read?: boolean
    group?: string
    action?: { label: string; onClick: () => void }
  }

  interface Props extends HTMLAttributes<HTMLDivElement> {
    notifications: Notification[]
    onDismiss?: (id: string) => void
    onDismissAll?: () => void
    onMarkAllRead?: () => void
    onMarkRead?: (id: string) => void
    maxVisible?: number
    emptyMessage?: string
    motion?: MotionLevel
    class?: string
  }

  let {
    notifications, onDismiss, onDismissAll, onMarkAllRead, onMarkRead, maxVisible = 10,
    emptyMessage = 'No notifications', motion, class: className, ...rest
  }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)

  type Entry = { type: 'group'; name: string } | { type: 'notification'; n: Notification }

  // Group headers appear before the first notification of each group, among the
  // visible ones only — as React builds them.
  const entries = $derived.by(() => {
    const visible = notifications.slice(0, maxVisible)
    const out: Entry[] = []
    const seen = new Set<string>()
    const grouped = visible.some(n => n.group)
    for (const n of visible) {
      if (grouped && n.group && !seen.has(n.group)) {
        seen.add(n.group)
        out.push({ type: 'group', name: n.group })
      }
      out.push({ type: 'notification', n })
    }
    return out
  })
  // Unread is counted across ALL notifications, not only the visible ones.
  const hasUnread = $derived(notifications.some(n => !n.read))
  const ts = (t: number | Date) => (t instanceof Date ? t.getTime() : t)
</script>

<div class={cn('ui-notification-stack', className)} data-motion={motionLevel()} {...rest}>
  <div class="ui-notification-stack__header">
    <h3 class="ui-notification-stack__title">Notifications</h3>
    <div class="ui-notification-stack__actions">
      {#if hasUnread && onMarkAllRead}<button type="button" class="ui-notification-stack__action-btn" onclick={onMarkAllRead}>Mark all read</button>{/if}
      {#if notifications.length > 0 && onDismissAll}<button type="button" class="ui-notification-stack__action-btn" onclick={onDismissAll}>Clear all</button>{/if}
    </div>
  </div>
  <div class="ui-notification-stack__list">
    {#if notifications.length === 0}
      <div class="ui-notification-stack__empty">{emptyMessage}</div>
    {:else}
      {#each entries as entry (entry.type === 'group' ? `group-${entry.name}` : entry.n.id)}
        {#if entry.type === 'group'}
          <div class="ui-notification-stack__group-header">{entry.name}</div>
        {:else}
          {@const n = entry.n}
          {@const unread = n.read === false || n.read === undefined}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
          <article class="ui-notification" data-variant={n.variant ?? 'default'} data-unread={unread ? '' : undefined} onclick={() => { if (unread) onMarkRead?.(n.id) }}>
            {#if unread}<div class="ui-notification__unread-dot"></div>{/if}
            {#if n.icon}<span class="ui-notification__icon"><Content value={n.icon} /></span>{/if}
            <div class="ui-notification__content">
              <div class="ui-notification__header-row">
                <p class="ui-notification__title">{n.title}</p>
                <span class="ui-notification__time" data-testid="notification-time">{fmtRelative(ts(n.timestamp))}</span>
              </div>
              {#if n.description}<p class="ui-notification__description">{n.description}</p>{/if}
              {#if n.action}
                <button type="button" class="ui-notification__action" onclick={e => { e.stopPropagation(); n.action!.onClick() }}>{n.action.label}</button>
              {/if}
            </div>
            {#if onDismiss}
              <button type="button" class="ui-notification__dismiss" aria-label="Dismiss notification" onclick={e => { e.stopPropagation(); onDismiss(n.id) }}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4 4L12 12M12 4L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>
              </button>
            {/if}
          </article>
        {/if}
      {/each}
    {/if}
  </div>
</div>
