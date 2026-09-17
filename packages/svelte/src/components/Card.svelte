<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'
  import Content from '../lib/Content.svelte'
  import Skeleton from './Skeleton.svelte'
  import { cssProps } from '../actions/css-props.js'
  import { mergeStyles, reactStyle, type StyleInput } from '../lib/react-style.js'
  import { useEntrance } from '../runes/entrance.svelte.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  type Part = 'root' | 'header' | 'footer' | 'content'

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'style'> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLElement | null
    /** Element to render. React also accepts a component here; Svelte takes a tag name. */
    as?: string
    variant?: 'default' | 'elevated' | 'outlined' | 'ghost' | 'glass' | 'gradient'
    padding?: 'none' | 'sm' | 'md' | 'lg'
    interactive?: boolean
    motion?: MotionLevel
    header?: string | Snippet
    footer?: string | Snippet
    expandable?: boolean
    defaultExpanded?: boolean
    loading?: boolean
    bordered?: boolean
    classNames?: Partial<Record<Part, string>>
    children?: Snippet
    style?: StyleInput
    class?: string
    href?: string
    target?: string
    rel?: string
  }

  let {
    as = 'div', variant = 'default', padding = 'md', interactive = false, motion, header, footer,
    expandable = false, defaultExpanded = true, loading = false, bordered, classNames, children,
    class: className, style, ref = $bindable(null), ...rest
  }: Props = $props()

  const cls = makeCls('card')
  const motionLevel = getMotionLevel(() => motion)
  const el = $derived(ref)
  // Reading only the initial value is intended: defaultExpanded is an uncontrolled default.
  // svelte-ignore state_referenced_locally
  let expanded = $state(defaultExpanded)
  // Subtle fade-up entrance at motion level 2+
  useEntrance(() => el, () => (motionLevel() >= 2 ? 'fade-up' : 'none'), () => ({ duration: 250 }))

  /* React: style={expandable ? {cursor:'pointer', ...rest.style} : rest.style}
   * followed by {...rest} — and rest still holds `style`, so a caller's style
   * replaces the merged object outright and cursor:pointer is lost. Kept as React
   * behaves: cursor only when expandable AND no caller style. */
  const styles = $derived(mergeStyles(expandable && style == null ? { cursor: 'pointer' } : null, style))

  function onCardClick(e: MouseEvent) {
    const target = e.target as HTMLElement
    // Ignore clicks on interactive children — except the card's own toggle.
    if (target.closest('button, a, input, select, textarea, [role="button"], [tabindex]')) {
      if (!target.closest('.ui-card__expand-toggle')) return
    }
    expanded = !expanded
  }
</script>

{#snippet toggle()}
  <button
    type="button"
    class="ui-card__expand-toggle"
    data-expanded={expanded}
    onclick={e => { e.stopPropagation(); expanded = !expanded }}
    aria-label={expanded ? 'Collapse' : 'Expand'}
    aria-expanded={expanded}
  >
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  </button>
{/snippet}

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<svelte:element
  this={as}
  bind:this={ref}
  class={cn(cls('root'), classNames?.root, className)}
  data-variant={variant}
  data-padding={padding}
  data-motion={motionLevel()}
  data-interactive={interactive || undefined}
  data-expandable={expandable || undefined}
  data-loading={loading || undefined}
  data-bordered={bordered || undefined}
  onclick={expandable ? onCardClick : undefined}
  use:cssProps={styles}
  {...rest}
>
  {#if header}
    <div class={cn('ui-card__header', classNames?.header)}><span><Content value={header} /></span>{#if expandable}{@render toggle()}{/if}</div>
  {:else if expandable}
    <div class={cn('ui-card__header', classNames?.header)} use:cssProps={reactStyle({ borderBlockEnd: 'none', marginBlockEnd: 0 })}><span></span>{@render toggle()}</div>
  {/if}
  {#if expandable}
    <div class={cn('ui-card__content', classNames?.content)} data-collapsed={!expanded}>
      <div class="ui-card__content-inner">{#if children}{@render children()}{/if}</div>
    </div>
  {:else if children}{@render children()}{/if}
  {#if footer}<div class={cn('ui-card__footer', classNames?.footer)}><Content value={footer} /></div>{/if}
  {#if loading}
    <Skeleton variant="rectangular" animate style={{ position: 'absolute', inset: 0, zIndex: 2, borderRadius: 'inherit' }} />
  {/if}
</svelte:element>
