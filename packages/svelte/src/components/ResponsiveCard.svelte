<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import Content from '../lib/Content.svelte'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  type Node = string | Snippet

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLElement | null
    image?: Node
    title: Node
    description?: Node
    actions?: Node
    badge?: Node
    variant?: 'default' | 'horizontal' | 'compact'
    motion?: MotionLevel
    class?: string
  }

  let { image, title, description, actions, badge, variant = 'default', motion, class: className, ref = $bindable(null), ...rest }: Props = $props()
  const motionLevel = getMotionLevel(() => motion)
</script>

<article class={cn('ui-responsive-card', className)} data-variant={variant} data-motion={motionLevel()} bind:this={ref} {...rest}>
  {#if badge}<div class="ui-responsive-card__badge"><Content value={badge} /></div>{/if}
  {#if image}<div class="ui-responsive-card__image"><Content value={image} /></div>{/if}
  <div class="ui-responsive-card__content">
    <h3 class="ui-responsive-card__title"><Content value={title} /></h3>
    {#if description}<p class="ui-responsive-card__description"><Content value={description} /></p>{/if}
  </div>
  {#if actions}<div class="ui-responsive-card__actions"><Content value={actions} /></div>{/if}
</article>
