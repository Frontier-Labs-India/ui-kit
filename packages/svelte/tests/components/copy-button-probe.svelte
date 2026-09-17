<script lang="ts">
  import CopyButton from '../../src/components/CopyButton.svelte'
  let { value = 'hello', timeout = 1000, onclick }: { value?: string; timeout?: number; onclick?: (e: MouseEvent) => void } = $props()
</script>

<CopyButton {value} {timeout} {onclick}>
  {#snippet children({ copied, copy })}<span class="state">{copied ? 'Copied!' : 'Copy'}</span><i class="again" role="presentation" onclick={e => { e.stopPropagation(); copy() }}></i>{/snippet}
</CopyButton>
