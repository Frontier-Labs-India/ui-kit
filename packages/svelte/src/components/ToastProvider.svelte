<script lang="ts" module>
  // Module level, as React's counter: ids stay unique across providers.
  let toastCounter = 0
</script>

<script lang="ts">
  import type { Snippet } from 'svelte'
  import Content from '../lib/Content.svelte'
  import ToastItem from '../lib/ToastItem.svelte'
  import { setToastContext, type ToastOptions } from '../lib/toast-context.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props {
    /** The toast container (React's ToastProvider takes no ref). Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    children?: string | Snippet
    position?: 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center'
    maxVisible?: number
    motion?: MotionLevel
  }

  let { children, position = 'top-right', maxVisible = 5, motion, ref = $bindable(null) }: Props = $props()
  const motionLevel = getMotionLevel(() => motion)

  type Internal = ToastOptions & { _id: string; _createdAt: number; _remaining: number; _paused: boolean }
  let toasts = $state<Internal[]>([])

  const dismiss = (id: string) => { toasts = toasts.filter(t => t._id !== id) }

  setToastContext({
    toast(options) {
      const id = options.id ?? `toast-${++toastCounter}`
      const internal: Internal = { ...options, _id: id, _createdAt: Date.now(), _remaining: options.duration ?? 5000, _paused: false }
      // A toast with a given id replaces the earlier one.
      toasts = [...(options.id ? toasts.filter(t => t._id !== options.id) : toasts), internal]
      return id
    },
    dismiss,
    dismissAll: () => { toasts = [] },
  })
</script>

<Content value={children} /><div bind:this={ref} class="ui-toast-container" data-position={position} data-motion={motionLevel()}>{#each toasts.slice(0, maxVisible) as t (t._id)}<ToastItem toast={t} onDismiss={dismiss} motionLevel={motionLevel()} />{/each}</div>
