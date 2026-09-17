<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'
  import Content from '../lib/Content.svelte'

  interface Props extends HTMLAttributes<HTMLElement> {
    title: string
    description?: string
    action?: string | Snippet
    size?: 'sm' | 'md' | 'lg'
    class?: string
  }

  // `children` is taken out and not rendered — React's SectionHeader destructures
  // it and drops it, so passing children must not change the markup here either.
  let { title, description, action, size = 'md', class: className, children: _children, ...rest }: Props & { children?: Snippet } = $props()
  const cls = makeCls('section-header')
</script>

<header class={cn(cls('root'), className)} data-size={size} {...rest}>
  <div class="ui-section-header__left">
    <h2 class="ui-section-header__title">{title}</h2>
    {#if description}<p class="ui-section-header__description">{description}</p>{/if}
  </div>
  {#if action}<div class="ui-section-header__action"><Content value={action} /></div>{/if}
</header>
