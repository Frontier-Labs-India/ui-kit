<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLButtonAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends Omit<HTMLButtonAttributes, 'children'> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLButtonElement | null
    value: string
    /** How long `copied` stays true, in ms. */
    timeout?: number
    /** React's render-prop children: receives { copied, copy }. */
    children: Snippet<[{ copied: boolean; copy: () => void }]>
    size?: 'xs' | 'sm' | 'md' | 'lg'
    motion?: MotionLevel
    class?: string
  }

  let { value, timeout = 2000, children, size = 'md', motion, class: className, onclick, ref = $bindable(null), ...rest }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)
  let copied = $state(false)
  let timer: ReturnType<typeof setTimeout> | null = null
  $effect(() => () => { if (timer) clearTimeout(timer) })

  function copy() {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return
    navigator.clipboard.writeText(value).then(() => {
      copied = true
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => { copied = false }, timeout)
    })
  }
</script>

<button
  type="button"
  class={cn('ui-copy-button', className)}
  data-size={size}
  data-copied={copied || undefined}
  data-motion={motionLevel()}
  onclick={e => { copy(); onclick?.(e) }}
  aria-label={copied ? 'Copied' : 'Copy to clipboard'}
  bind:this={ref}
  {...rest}
>{@render children({ copied, copy })}</button>
