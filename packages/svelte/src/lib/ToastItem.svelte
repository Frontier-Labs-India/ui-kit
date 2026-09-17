<script lang="ts">
  import Content from './Content.svelte'
  import { cssProps } from '../actions/css-props.js'
  import { reactStyle } from './react-style.js'
  import type { ToastOptions } from './toast-context.js'

  // One toast of ToastProvider, timed out after its duration, paused while hovered.
  let { toast: t, onDismiss, motionLevel }: {
    toast: ToastOptions & { _id: string; _remaining: number }
    onDismiss: (id: string) => void
    motionLevel: number
  } = $props()

  const dismissible = $derived(t.dismissible !== false)
  const variant = $derived(t.variant ?? 'default')
  const duration = $derived(t.duration ?? 5000)
  const persistent = $derived(duration === 0)

  // svelte-ignore state_referenced_locally
  let remaining = t._remaining
  let started = Date.now()
  let timer: ReturnType<typeof setTimeout> | null = null

  function start() {
    if (persistent || remaining <= 0) return
    started = Date.now()
    timer = setTimeout(() => onDismiss(t._id), remaining)
  }
  function pause() {
    if (timer) { clearTimeout(timer); timer = null }
    remaining = Math.max(0, remaining - (Date.now() - started))
  }

  $effect(() => {
    start()
    return () => { if (timer) clearTimeout(timer) }
  })

  const COLORS: Record<string, string> = {
    success: 'var(--status-positive, oklch(72% 0.19 155))',
    warning: 'var(--status-warning, oklch(80% 0.16 80))',
    error: 'var(--status-critical, oklch(65% 0.25 25))',
    info: 'var(--brand, oklch(65% 0.2 270))',
  }
  const color = $derived(COLORS[variant])
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="ui-toast" role="status" aria-live={variant === 'error' ? 'assertive' : 'polite'} data-variant={variant} data-motion={motionLevel} onmouseenter={pause} onmouseleave={start}
>{#if t.icon}<span class="ui-toast__icon"><Content value={t.icon} /></span>{:else if variant !== 'default'}<span class="ui-toast__icon">{#if color}{#if variant === 'success'}<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="7" stroke={color} stroke-width="1.5" /><path d="M5 8l2 2 4-4" stroke={color} stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>{:else if variant === 'error'}<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="7" stroke={color} stroke-width="1.5" /><path d="M6 6l4 4M10 6l-4 4" stroke={color} stroke-width="1.5" stroke-linecap="round" /></svg>{:else if variant === 'warning'}<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 1.5L14.5 13H1.5L8 1.5z" stroke={color} stroke-width="1.5" stroke-linejoin="round" /><path d="M8 6v3M8 11.5v0" stroke={color} stroke-width="1.5" stroke-linecap="round" /></svg>{:else}<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="7" stroke={color} stroke-width="1.5" /><path d="M8 7v4M8 4.5v0" stroke={color} stroke-width="1.5" stroke-linecap="round" /></svg>{/if}{/if}</span>{/if}<div class="ui-toast__content"><p class="ui-toast__title">{t.title}</p>{#if t.description}<p class="ui-toast__description">{t.description}</p>{/if}{#if t.action}<button type="button" class="ui-toast__action" onclick={t.action.onClick}>{t.action.label}</button>{/if}</div>{#if dismissible}<button type="button" class="ui-toast__close" onclick={() => onDismiss(t._id)} aria-label="Dismiss"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4 4L12 12M12 4L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg></button>{/if}{#if !persistent}<div class="ui-toast__progress" use:cssProps={reactStyle({ inlineSize: '100%', animationDuration: `${duration}ms` })}></div>{/if}</div>
