<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'
  import Content from '../lib/Content.svelte'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  type Part = 'root' | 'icon' | 'content' | 'title' | 'body' | 'dismiss'

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
    variant: 'info' | 'success' | 'warning' | 'error'
    title?: string | Snippet
    icon?: string | Snippet
    dismissible?: boolean
    onDismiss?: () => void
    action?: { label: string; onClick: () => void }
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    banner?: boolean
    compact?: boolean
    motion?: MotionLevel
    classNames?: Partial<Record<Part, string>>
    children?: Snippet
    class?: string
  }

  let {
    variant, title, icon, dismissible = false, onDismiss, action, size = 'md', banner = false, compact = false,
    motion, classNames, children, class: className, ...rest
  }: Props = $props()

  const cls = makeCls('alert')
  const motionLevel = getMotionLevel(() => motion)
  // Informational variants are polite status; warning and error interrupt.
  const role = $derived(variant === 'warning' || variant === 'error' ? 'alert' : 'status')
</script>

<div
  class={cn(cls('root'), classNames?.root, className)}
  data-variant={variant}
  data-size={size}
  data-banner={banner || undefined}
  data-compact={compact || undefined}
  data-motion={motionLevel()}
  {role}
  {...rest}
>
  <span class={cn('ui-alert__icon', classNames?.icon)} aria-hidden="true">
    {#if icon}<Content value={icon} />
    {:else}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        {#if variant === 'info'}
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
        {:else if variant === 'success'}
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
        {:else if variant === 'warning'}
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
        {:else}
          <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
        {/if}
      </svg>
    {/if}
  </span>
  <div class={cn('ui-alert__content', classNames?.content)}>
    {#if title}<div class={cn('ui-alert__title', classNames?.title)}><Content value={title} /></div>{/if}
    <div class={cn('ui-alert__body', classNames?.body)}>{#if children}{@render children()}{/if}</div>
    {#if action}
      <div class="ui-alert__actions">
        <button type="button" class="ui-alert__action-btn" onclick={action.onClick}>{action.label}</button>
      </div>
    {/if}
  </div>
  {#if dismissible}
    <button type="button" class={cn('ui-alert__dismiss', classNames?.dismiss)} onclick={onDismiss} aria-label="Dismiss">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  {/if}
</div>
