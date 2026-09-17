<script lang="ts">
  import ToastProvider from '../../src/components/ToastProvider.svelte'
  import Consumer from './toast-consumer.svelte'
  import type { ToastApi } from '../../src/lib/toast-context.js'
  let { onApi, maxVisible = 5 }: { onApi: (api: ToastApi) => void; maxVisible?: number } = $props()
</script>

<ToastProvider {maxVisible}>
  {#snippet children()}<Consumer {onApi} />{/snippet}
</ToastProvider>
