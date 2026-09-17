<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'

  interface Props extends HTMLAttributes<HTMLElement> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLHRElement | HTMLDivElement | null
    orientation?: 'horizontal' | 'vertical'
    variant?: 'solid' | 'dashed' | 'dotted'
    label?: string | Snippet
    spacing?: 'sm' | 'md' | 'lg'
    class?: string
  }

  let { orientation = 'horizontal', variant = 'solid', label, spacing = 'md', class: className, ref = $bindable(null), ...rest }: Props = $props()

  // `!= null`, as React: an empty-string label still renders the labelled form.
  const hasLabel = $derived(label != null)
  const ariaOrientation = $derived(orientation === 'vertical' ? 'vertical' : undefined)
</script>

{#if hasLabel}
  <div
    role="separator"
    class={cn('ui-divider', className)}
    data-orientation={orientation}
    data-variant={variant}
    data-spacing={spacing}
    data-has-label="true"
    aria-orientation={ariaOrientation}
    bind:this={ref}
    {...rest}
  >
    <span class="ui-divider__label">{#if typeof label === 'function'}{@render label()}{:else}{label}{/if}</span>
  </div>
{:else}
  <!-- role is implicit on <hr>, but React emits it and the DOM contract is
       React's markup exactly, so it stays. -->
  <!-- svelte-ignore a11y_no_redundant_roles -->
  <hr
    role="separator"
    class={cn('ui-divider', className)}
    data-orientation={orientation}
    data-variant={variant}
    data-spacing={spacing}
    aria-orientation={ariaOrientation}
    bind:this={ref}
    {...rest}
  />
{/if}
