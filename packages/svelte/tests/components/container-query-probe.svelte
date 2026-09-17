<script lang="ts">
  import ContainerQuery from '../../src/components/ContainerQuery.svelte'
</script>

<ContainerQuery>
  {#snippet children(size)}<output>{size.width}x{size.height} {size.breakpoint}</output>{/snippet}
</ContainerQuery>
