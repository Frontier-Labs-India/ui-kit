<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    size?: 'sm' | 'md' | 'lg'
    animated?: boolean
    label?: string
    motion?: MotionLevel
    class?: string
  }

  const PARTICLE_COUNT = 8

  let { size = 'md', animated = true, label = 'Success', motion, class: className, ref = $bindable(null), ...rest }: Props = $props()

  const cls = makeCls('success-checkmark')
  const motionLevel = getMotionLevel(() => motion)
</script>

<div
  class={cn(cls('root'), className)}
  data-size={size}
  data-animated={String(animated)}
  data-motion={motionLevel()}
  role="img"
  aria-label={label}
  bind:this={ref}
  {...rest}
>
  <svg class="ui-success-checkmark__svg" viewBox="0 0 52 52" aria-hidden="true">
    <circle class="ui-success-checkmark__circle-fill" cx="26" cy="26" r="24" />
    <circle class="ui-success-checkmark__circle" cx="26" cy="26" r="24" />
    <polyline class="ui-success-checkmark__check" points="16 26 22 32 36 20" />
  </svg>
  <!-- Burst particles at motion level 3 -->
  {#if motionLevel() >= 3 && animated}
    {#each Array.from({ length: PARTICLE_COUNT }) as _, i (i)}<span class="ui-success-checkmark__particle" aria-hidden="true"></span>{/each}
  {/if}
</div>
