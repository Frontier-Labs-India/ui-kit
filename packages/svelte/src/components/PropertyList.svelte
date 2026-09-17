<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import Content from '../lib/Content.svelte'
  import ErrorBoundary from '../lib/ErrorBoundary.svelte'
  import { useEntrance } from '../runes/entrance.svelte.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  export interface PropertyItem {
    label: string
    value: string | number | Snippet
    copyable?: boolean
    mono?: boolean
    href?: string
  }

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    items: PropertyItem[]
    columns?: 1 | 2
    size?: 'sm' | 'md' | 'lg'
    striped?: boolean
    motion?: MotionLevel
    class?: string
  }

  let { items, columns = 1, size = 'md', striped, motion, class: className, ref = $bindable(null), ...rest }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)
  const el = $derived(ref)
  let copiedIndex = $state<number | null>(null)
  useEntrance(() => el, () => (motionLevel() >= 2 ? 'fade-up' : 'none'), () => ({ duration: 280 }))

  function copy(value: PropertyItem['value'], index: number) {
    // React copies String(value); a snippet has no text to copy, which only a
    // string or number value can provide.
    const text = typeof value === 'string' ? value : String(value)
    navigator.clipboard.writeText(text).then(() => {
      copiedIndex = index
      setTimeout(() => (copiedIndex = null), 2000)
    })
  }
</script>

<ErrorBoundary>
  <div
    bind:this={ref}
    class={cn('ui-property-list', className)}
    data-motion={motionLevel()}
    data-size={size}
    data-columns={columns}
    data-striped={striped ? '' : undefined}
    role="list"
    aria-label="Properties"
    {...rest}
  >
    {#each items as item, i (`${item.label}-${i}`)}
      <div class="ui-property-list__row" role="listitem">
        <span class="ui-property-list__label">{item.label}</span>
        <span class="ui-property-list__value" data-mono={item.mono ? '' : undefined}>
          {#if item.href}<a class="ui-property-list__link" href={item.href} target="_blank" rel="noopener noreferrer"><Content value={item.value} /></a>
          {:else}<Content value={item.value} />{/if}
          {#if item.copyable}
            <button class="ui-property-list__copy" onclick={() => copy(item.value, i)} aria-label={`Copy ${item.label}`} type="button" data-copied={copiedIndex === i ? '' : undefined}>
              {#if copiedIndex === i}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
              {:else}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
              {/if}
            </button>
          {/if}
        </span>
      </div>
    {/each}
  </div>
</ErrorBoundary>
