<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import Content from '../lib/Content.svelte'
  import { useEntrance } from '../runes/entrance.svelte.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  type Node = string | Snippet

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    icon?: Node
    title: Node
    description?: Node
    action?: Node
    secondaryAction?: Node
    size?: 'sm' | 'md' | 'lg'
    motion?: MotionLevel
    class?: string
  }

  let { icon, title, description, action, secondaryAction, size = 'md', motion, class: className, ref = $bindable(null), ...rest }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)
  const el = $derived(ref)
  // Scale entrance at motion level 2+
  useEntrance(() => el, () => (motionLevel() >= 2 ? 'scale' : 'none'), () => ({ duration: 350 }))
</script>

<div bind:this={ref} class={cn('ui-empty-state', className)} data-size={size} data-motion={motionLevel()} {...rest}>
  {#if icon}<div class="ui-empty-state__icon" aria-hidden="true"><Content value={icon} /></div>{/if}
  <h3 class="ui-empty-state__title"><Content value={title} /></h3>
  {#if description}<p class="ui-empty-state__description"><Content value={description} /></p>{/if}
  {#if action || secondaryAction}
    <div class="ui-empty-state__actions"><Content value={action} /><Content value={secondaryAction} /></div>
  {/if}
</div>
