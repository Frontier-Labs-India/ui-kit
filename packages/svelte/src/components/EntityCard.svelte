<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import Content from '../lib/Content.svelte'
  import ErrorBoundary from '../lib/ErrorBoundary.svelte'
  import { cssProps } from '../actions/css-props.js'
  import { reactStyle } from '../lib/react-style.js'
  import { useEntrance } from '../runes/entrance.svelte.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends HTMLAttributes<HTMLDivElement> {
    name: string
    type?: string
    status?: 'ok' | 'warning' | 'critical' | 'unknown' | 'maintenance'
    icon?: string | Snippet
    metrics?: { label: string; value: string }[]
    tags?: string[]
    href?: string
    actions?: { label: string; icon?: string | Snippet; onClick: () => void }[]
    compact?: boolean
    size?: 'sm' | 'md' | 'lg'
    motion?: MotionLevel
    class?: string
  }

  let {
    name, type, status, icon, metrics, tags, href, actions, compact, size = 'md', motion, class: className, onclick, ...rest
  }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)
  let el = $state<HTMLDivElement | null>(null)
  useEntrance(() => el, () => (motionLevel() >= 2 ? 'fade-up' : 'none'), () => ({ duration: 280 }))
  const clickable = $derived(!!href || !!onclick)
  // React's wrapper carries a static style object; applied through setProperty.
  const wrapperStyle = reactStyle({ textDecoration: 'none', color: 'inherit' })
</script>

<ErrorBoundary>
  <svelte:element this={href ? 'a' : 'div'} href={href || undefined} use:cssProps={wrapperStyle}>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      bind:this={el}
      class={cn('ui-entity-card', className)}
      data-motion={motionLevel()}
      data-size={size}
      data-status={status || undefined}
      data-compact={compact ? '' : undefined}
      data-clickable={clickable ? '' : undefined}
      role="group"
      aria-label={name}
      {onclick}
      {...rest}
    >
      <div class="ui-entity-card__header">
        {#if icon}<span class="ui-entity-card__icon"><Content value={icon} /></span>{/if}
        <div class="ui-entity-card__info">
          <h3 class="ui-entity-card__name" title={name}>{name}</h3>
          {#if type}<p class="ui-entity-card__type">{type}</p>{/if}
        </div>
        {#if status}<span class="ui-entity-card__status" data-status={status}><span class="ui-entity-card__status-dot" aria-hidden="true"></span>{status}</span>{/if}
      </div>
      {#if metrics && metrics.length > 0}
        <div class="ui-entity-card__metrics">
          {#each metrics as m, i (`${m.label}-${i}`)}
            <div class="ui-entity-card__metric"><span class="ui-entity-card__metric-value">{m.value}</span><span class="ui-entity-card__metric-label">{m.label}</span></div>
          {/each}
        </div>
      {/if}
      {#if tags && tags.length > 0}
        <div class="ui-entity-card__tags">{#each tags as tag (tag)}<span class="ui-entity-card__tag">{tag}</span>{/each}</div>
      {/if}
      {#if actions && actions.length > 0}
        <div class="ui-entity-card__actions">
          {#each actions as action (action.label)}
            <!-- Actions sit inside a link when href is set: stop the click reaching it. -->
            <button class="ui-entity-card__action" onclick={e => { e.stopPropagation(); e.preventDefault(); action.onClick() }} type="button" aria-label={action.label}><Content value={action.icon} />{action.label}</button>
          {/each}
        </div>
      {/if}
    </div>
  </svelte:element>
</ErrorBoundary>
