<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls'
  import { getMotionLevel } from '../runes/motion-level.svelte'
  import type { MotionLevel } from '../runes/context'

  /** A single item definition for the Accordion. */
  export interface AccordionItem {
    /** Unique identifier for the item, used in defaultOpen and onOpenChange. */
    id: string
    /** Content rendered as the clickable summary header. */
    trigger: string | Snippet
    /** Content revealed when the item is expanded. */
    content: string | Snippet
    /** When true, the item cannot be toggled. */
    disabled?: boolean
    /** Leading icon rendered before the trigger text. */
    icon?: Snippet
  }

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /** Array of accordion items to render. */
    items: AccordionItem[]
    /** `'single'` closes others when one opens; `'multiple'` allows many open at once. */
    type?: 'single' | 'multiple'
    /** Array of item IDs that should be expanded on initial render. */
    defaultOpen?: string[]
    /** Callback fired when the set of open items changes. */
    onOpenChange?: (openIds: string[]) => void
    /** Motion intensity override (0=none, 1=subtle, 2=expressive, 3=cinematic). */
    motion?: MotionLevel
    /** Visual style variant. */
    variant?: 'default' | 'bordered' | 'separated'
    /** Component size controlling padding and font-size. */
    size?: 'sm' | 'md' | 'lg'
    class?: string
  }

  let {
    items,
    type = 'single',
    defaultOpen = [],
    onOpenChange,
    motion,
    variant = 'default',
    size = 'md',
    class: className,
    ...rest
  }: Props = $props()

  const cls = makeCls('accordion')
  // A getter, not a value — the script body runs once; see motion-level.svelte.ts.
  const motionLevel = getMotionLevel(() => motion)

  // Spread, not a reference: $state(defaultOpen) would alias the caller's array.
  let openIds = $state<string[]>([...defaultOpen])

  function toggle(item: AccordionItem, e: Event) {
    // Prevent default so open state stays controlled here, as React does.
    e.preventDefault()
    if (item.disabled) return
    const isOpen = openIds.includes(item.id)
    openIds = isOpen
      ? openIds.filter(i => i !== item.id)
      : type === 'single'
        ? [item.id]
        : [...openIds, item.id]
    onOpenChange?.(openIds)
  }
</script>

<div
  class={cn(cls('root'), className)}
  data-motion={motionLevel()}
  data-variant={variant}
  data-size={size}
  {...rest}
>
  {#each items as item (item.id)}
    <details open={openIds.includes(item.id)}>
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <summary
        onclick={(e) => toggle(item, e)}
        aria-disabled={item.disabled ? 'true' : undefined}
      >
        <span>
          {#if item.icon}
            <span class="ui-accordion__item-icon" aria-hidden="true">{@render item.icon()}</span>
          {/if}
          {#if typeof item.trigger === 'function'}{@render item.trigger()}{:else}{item.trigger}{/if}
        </span>
        <svg class="ui-accordion__chevron" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </summary>
      <div class="ui-accordion__content-wrapper">
        <div class="ui-accordion__content">
          <div class="ui-accordion__content-inner">
            {#if typeof item.content === 'function'}{@render item.content()}{:else}{item.content}{/if}
          </div>
        </div>
      </div>
    </details>
  {/each}
</div>
