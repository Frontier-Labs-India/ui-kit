<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends HTMLAttributes<HTMLSpanElement> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLSpanElement | null
    status: 'ok' | 'warning' | 'critical' | 'info'
    size?: 'sm' | 'md' | 'lg'
    label?: string
    motion?: MotionLevel
    class?: string
  }

  let { status, size = 'md', label, motion, class: className, ref = $bindable(null), ...rest }: Props = $props()

  const cls = makeCls('status-pulse')
  const motionLevel = getMotionLevel(() => motion)
</script>

<span
  class={cn(cls('root'), className)}
  data-status={status}
  data-size={size}
  data-motion={motionLevel()}
  role="img"
  aria-label={label}
  bind:this={ref}
  {...rest}
>
  <span class="ui-status-pulse__dot" aria-hidden="true"></span>
  <span class="ui-status-pulse__ring" aria-hidden="true"></span>
  <span class="ui-status-pulse__ring" aria-hidden="true"></span>
  <span class="ui-status-pulse__ring" aria-hidden="true"></span>
</span>
