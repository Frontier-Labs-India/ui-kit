<script lang="ts">
  let { shouldThrow }: { shouldThrow: () => boolean } = $props()
  // Deliberately evaluated once, during init — that is the failure being simulated.
  // svelte-ignore state_referenced_locally
  if (shouldThrow()) throw new Error('boom')
</script>

<span>child ok</span>
