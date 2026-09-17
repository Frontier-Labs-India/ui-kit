<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import ErrorBoundary from '../lib/ErrorBoundary.svelte'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    avatar?: string | Snippet
    label?: string
    size?: 'sm' | 'md'
    motion?: MotionLevel
    class?: string
  }

  let { avatar, label = 'Someone is typing...', size = 'md', motion, class: className, ref = $bindable(null), ...rest }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)
</script>

<ErrorBoundary>
  <div
    class={cn('ui-typing-indicator', className)}
    data-motion={motionLevel()}
    data-size={size}
    role="status"
    aria-live="polite"
    bind:this={ref}
    {...rest}
  >
    {#if avatar}
      <span class="ui-typing-indicator__avatar">{#if typeof avatar === 'function'}{@render avatar()}{:else}{avatar}{/if}</span>
    {/if}
    <span class="ui-typing-indicator__dots" aria-hidden="true">
      <span class="ui-typing-indicator__dot"></span>
      <span class="ui-typing-indicator__dot"></span>
      <span class="ui-typing-indicator__dot"></span>
    </span>
    <span class="ui-typing-indicator__label">{label}</span>
  </div>
</ErrorBoundary>
