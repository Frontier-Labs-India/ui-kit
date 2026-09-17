<script lang="ts">
  import Checkbox from '../../src/components/Checkbox.svelte'
  let on = $state(true)
</script>

<Checkbox label="Accept" bind:checked={on} />
<output>{on}</output>
