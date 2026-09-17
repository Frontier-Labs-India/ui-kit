<script lang="ts">
  import ToggleSwitch from '../../src/components/ToggleSwitch.svelte'
  let on = $state(false)
</script>

<ToggleSwitch label="Wi-Fi" bind:checked={on} />
<output>{on}</output>
