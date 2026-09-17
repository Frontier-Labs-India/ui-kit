<script lang="ts">
  import Calendar from '../../src/components/Calendar.svelte'
  let value = $state<Date | null>(new Date(2026, 0, 10))
  let calls = $state(0)
</script>

<Calendar bind:value onChange={() => calls++} />
<output data-calls={calls}>{value ? value.getDate() : 'none'}</output>
