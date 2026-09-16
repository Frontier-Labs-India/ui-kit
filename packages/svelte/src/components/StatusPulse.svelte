<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends HTMLAttributes<HTMLSpanElement> {
    status: 'ok' | 'warning' | 'critical' | 'info'
    size?: 'sm' | 'md' | 'lg'
    label?: string
    motion?: MotionLevel
    class?: string
  }

  let { status, size = 'md', label, motion, class: className, ...rest }: Props = $props()

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
  {...rest}
>
  <span class="ui-status-pulse__dot" aria-hidden="true"></span>
  <span class="ui-status-pulse__ring" aria-hidden="true"></span>
  <span class="ui-status-pulse__ring" aria-hidden="true"></span>
  <span class="ui-status-pulse__ring" aria-hidden="true"></span>
</span>
