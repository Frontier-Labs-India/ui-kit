<script lang="ts">
  import type { Snippet } from 'svelte'

  /* Svelte twin of ComponentErrorBoundary (src/core/utils/error-boundary.tsx),
   * which wraps 37 React components. Same fallback markup and text, same
   * retry behaviour through the boundary's reset.
   *
   * React's fallback is styled with inline style objects. Those are CSP-safe in
   * React (setProperty) and would be blocked static style attributes here, so
   * the same rules live in svelte-only.css under .ui-error-boundary. */

  interface Props {
    children: Snippet
    fallback?: Snippet<[Error, () => void]>
    onError?: (error: unknown) => void
  }

  let { children, fallback, onError }: Props = $props()

  function handle(error: unknown) {
    onError?.(error)
    console.error('[UI Kit] Component error:', error)
  }
</script>

<svelte:boundary onerror={handle}>
  {@render children()}

  {#snippet failed(error, reset)}
    {#if fallback}
      {@render fallback(error as Error, reset)}
    {:else}
      <div role="alert" class="ui-error-boundary">
        <span class="ui-error-boundary__title">Unable to display component</span>
        <span class="ui-error-boundary__message">{(error as Error)?.message || 'An unexpected error occurred'}</span>
        <button class="ui-error-boundary__retry" onclick={reset}>Retry</button>
      </div>
    {/if}
  {/snippet}
</svelte:boundary>
