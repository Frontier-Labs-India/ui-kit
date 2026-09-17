<script lang="ts">
  import { getToast, type ToastApi } from '../../src/lib/toast-context.js'
  let { onApi }: { onApi: (api: ToastApi) => void } = $props()
  // svelte-ignore state_referenced_locally
  onApi(getToast())
</script>
