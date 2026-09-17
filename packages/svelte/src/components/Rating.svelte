<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'
  import Content from '../lib/Content.svelte'
  import { cssProps } from '../actions/css-props.js'
  import { mergeStyles, type StyleInput } from '../lib/react-style.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'onchange' | 'style'> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    /** Controlled when set. */
    value?: number
    defaultValue?: number
    onChange?: (value: number) => void
    max?: number
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    readOnly?: boolean
    allowHalf?: boolean
    icon?: string | Snippet
    emptyIcon?: string | Snippet
    color?: string
    motion?: MotionLevel
    style?: StyleInput
    class?: string
  }

  const STAR = '12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2'

  let {
    value, defaultValue = 0, onChange, max = 5, size = 'md', readOnly = false, allowHalf = false, icon, emptyIcon, color,
    motion, class: className, style, ref = $bindable(null), ...rest
  }: Props = $props()

  const cls = makeCls('rating')
  const motionLevel = getMotionLevel(() => motion)
  const uid = $props.id()
  const clipId = `star-half-clip-${uid}`
  // svelte-ignore state_referenced_locally
  let internal = $state(defaultValue)
  let hoverIndex = $state<number | null>(null)
  const current = $derived(value !== undefined ? value : internal)
  const step = $derived(allowHalf ? 0.5 : 1)

  function set(v: number) {
    if (readOnly) return
    if (value === undefined) internal = v
    onChange?.(v)
  }

  function keydown(e: KeyboardEvent) {
    if (readOnly) return
    let next: number
    switch (e.key) {
      case 'ArrowRight': case 'ArrowUp': next = current + step; break
      case 'ArrowLeft': case 'ArrowDown': next = current - step; break
      case 'Home': next = 0; break
      case 'End': next = max; break
      default: return
    }
    e.preventDefault()
    if (next < 0 || next > max) return
    set(next)
  }

  const stateOf = (i: number): 'full' | 'half' | 'empty' =>
    i + 1 <= current ? 'full' : allowHalf && i + 0.5 <= current && i + 1 > current ? 'half' : 'empty'

  /* React: `{...(color ? { style: {'--rating-color': color, ...rest.style} } : {})}`
   * then `{...rest}` — rest still holds style, so a caller's style replaces the
   * merged one and the colour variable is lost. Kept as React behaves. */
  const styles = $derived(mergeStyles(color && style == null ? { '--rating-color': color } : null, style))
  // `||`, as React: an empty aria-label also falls back to 'Rating'.
  const ariaLabel = $derived((rest as Record<string, unknown>)['aria-label'] || 'Rating')
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
  class={cn(cls('root'), className)}
  data-size={size}
  data-motion={motionLevel()}
  data-readonly={readOnly || undefined}
  role="slider"
  tabindex={readOnly ? -1 : 0}
  aria-label={ariaLabel as string}
  aria-valuenow={current}
  aria-valuemin={0}
  aria-valuemax={max}
  aria-valuetext={`${current} of ${max} stars`}
  aria-readonly={readOnly || undefined}
  onkeydown={keydown}
  onmouseleave={() => (hoverIndex = null)}
  use:cssProps={styles}
  bind:this={ref}
  {...rest}
>
  {#each Array.from({ length: max }) as _, i (i)}
    {@const state = stateOf(i)}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <span
      class="ui-rating__star"
      data-state={state}
      data-hover={hoverIndex !== null && i <= hoverIndex && !readOnly ? 'true' : undefined}
      onclick={() => { if (!readOnly) set(i + 1) }}
      onmouseenter={() => { if (!readOnly) hoverIndex = i }}
      role="presentation"
    >
      {#if state === 'full'}
        {#if icon}<Content value={icon} />{:else}<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1" aria-hidden="true"><polygon points={STAR} /></svg>{/if}
      {:else if state === 'half'}
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <defs><clipPath id={clipId}><rect x="0" y="0" width="12" height="24" /></clipPath></defs>
          <polygon points={STAR} fill="none" stroke="currentColor" stroke-width="1.5" />
          <polygon points={STAR} fill="currentColor" clip-path={`url(#${clipId})`} />
        </svg>
      {:else}
        {#if emptyIcon}<Content value={emptyIcon} />{:else}<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><polygon points={STAR} /></svg>{/if}
      {/if}
    </span>
  {/each}
</div>
