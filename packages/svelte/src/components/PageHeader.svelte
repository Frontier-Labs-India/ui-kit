<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'
  import Content from '../lib/Content.svelte'

  interface Props extends HTMLAttributes<HTMLElement> {
    title: string
    description?: string
    actions?: string | Snippet
    size?: 'sm' | 'md' | 'lg'
    breadcrumbs?: string | Snippet
    class?: string
  }

  let { title, description, actions, size = 'md', breadcrumbs, class: className, ...rest }: Props = $props()
  const cls = makeCls('page-header')
</script>

<header class={cn(cls('root'), className)} data-size={size} {...rest}>
  {#if breadcrumbs}
    <nav class="ui-page-header__breadcrumbs" aria-label="Breadcrumb"><Content value={breadcrumbs} /></nav>
  {/if}
  <div class="ui-page-header__row">
    <div class="ui-page-header__content">
      <h1 class="ui-page-header__title">{title}</h1>
      {#if description}<p class="ui-page-header__description">{description}</p>{/if}
    </div>
    {#if actions}<div class="ui-page-header__actions"><Content value={actions} /></div>{/if}
  </div>
</header>
