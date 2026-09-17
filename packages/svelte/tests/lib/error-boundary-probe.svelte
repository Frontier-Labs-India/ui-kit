<script lang="ts">
  import ErrorBoundary from '../../src/lib/ErrorBoundary.svelte'
  import Thrower from './thrower.svelte'
  let { shouldThrow, onError }: { shouldThrow: () => boolean; onError?: (e: unknown) => void } = $props()
</script>

<ErrorBoundary {onError}>
  <Thrower {shouldThrow} />
</ErrorBoundary>
