<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'
  import Content from '../lib/Content.svelte'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends HTMLAttributes<HTMLSpanElement> {
    status: 'ok' | 'warning' | 'critical' | 'info' | 'unknown' | 'maintenance'
    label?: string
    icon?: string | Snippet
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    pulse?: boolean
    motion?: MotionLevel
    class?: string
  }

  let { status, label, icon, size = 'sm', pulse = false, motion, class: className, ...rest }: Props = $props()

  const cls = makeCls('status-badge')
  const motionLevel = getMotionLevel(() => motion)
</script>

<span
  role="status"
  class={cn(cls('root'), className)}
  data-status={status}
  data-size={size}
  data-motion={motionLevel()}
  {...rest}
>
  <span class="ui-status-badge__dot" data-pulse={pulse || undefined} aria-hidden="true"></span>
  {#if icon}<span class="ui-status-badge__icon" aria-hidden="true"><Content value={icon} /></span>{/if}
  {#if label}<span class="ui-status-badge__label">{label}</span>{/if}
</span>
