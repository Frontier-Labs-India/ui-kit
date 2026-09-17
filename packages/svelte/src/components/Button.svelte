<script module lang="ts">
  export interface ButtonShortcuts {
    activate?: string
  }
</script>

<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLButtonAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'
  import Content from '../lib/Content.svelte'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'
  import { haptic, type HapticType } from '../vendor/core/input/haptics.js'

  interface Props extends HTMLButtonAttributes {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'link'
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    loading?: boolean
    loadingText?: string
    icon?: string | Snippet
    iconEnd?: string | Snippet
    fullWidth?: boolean
    iconOnly?: boolean
    motion?: MotionLevel
    haptics?: boolean | HapticType
    shortcuts?: ButtonShortcuts
    classNames?: Partial<Record<'root' | 'icon' | 'iconEnd', string>>
    disabled?: boolean
    children?: Snippet
    class?: string
  }

  let {
    variant = 'primary', size = 'md', loading = false, loadingText, icon, iconEnd, fullWidth, iconOnly,
    motion, haptics, shortcuts, classNames, disabled, children, class: className, onclick,
    type = 'button', ...rest
  }: Props = $props()

  const cls = makeCls('button')
  const motionLevel = getMotionLevel(() => motion)
  let lastClick = 0
  let element: HTMLButtonElement | undefined

  /* Debounces rapid clicks (150ms) and gives haptic feedback, as React does. */
  function handleClick(e: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
    if (loading || disabled) return
    const now = Date.now()
    if (now - lastClick < 150) return
    lastClick = now
    if (haptics) haptic(haptics === true ? 'light' : haptics)
    onclick?.(e)
  }

  $effect(() => {
    const activate = shortcuts?.activate
    if (!activate) return
    const parts = activate.toLowerCase().split('+').map(p => p.trim())
    const key = parts[parts.length - 1]
    const needsCtrl = parts.includes('ctrl') || parts.includes('control')
    const needsMeta = parts.includes('meta') || parts.includes('cmd')
    const needsShift = parts.includes('shift')
    const needsAlt = parts.includes('alt')

    const handler = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== key) return
      if (needsCtrl && !e.ctrlKey) return
      if (needsMeta && !e.metaKey) return
      if (needsShift && !e.shiftKey) return
      if (needsAlt && !e.altKey) return
      e.preventDefault()
      element?.click()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  })
</script>

<button
  bind:this={element}
  {type}
  {disabled}
  class={cn(cls('root'), classNames?.root, className)}
  data-variant={variant}
  data-size={size}
  data-loading={loading}
  data-has-loading-text={loading && loadingText ? true : undefined}
  data-full-width={fullWidth || undefined}
  data-icon-only={iconOnly || undefined}
  data-motion={motionLevel()}
  onclick={handleClick}
  aria-busy={loading || undefined}
  aria-disabled={disabled || undefined}
  aria-keyshortcuts={shortcuts?.activate || undefined}
  {...rest}
>{#if icon}<span class={cn('ui-button__icon', classNames?.icon)}><Content value={icon} /></span>{/if}{#if loading && loadingText}{loadingText}{:else if children}{@render children()}{/if}{#if iconEnd}<span class={cn('ui-button__icon-end', classNames?.iconEnd)}><Content value={iconEnd} /></span>{/if}</button>
