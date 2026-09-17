<script lang="ts">
  import FormInput from '../../src/components/FormInput.svelte'
  let value = $state<string | undefined>(undefined)
</script>

<FormInput name="x" aria-label="X" bind:value />
<output>{value ?? 'undefined'}</output>
