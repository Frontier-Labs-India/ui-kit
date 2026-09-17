<script lang="ts">
  import Chip from '../../src/components/Chip.svelte'
  let on = $state(false)
  let calls = $state(0)
</script>

<Chip bind:checked={on} onChange={() => calls++}>Tag</Chip>
<output data-calls={calls}>{on}</output>
