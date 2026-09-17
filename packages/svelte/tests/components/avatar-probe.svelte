<script lang="ts">
  import AvatarGroup from '../../src/components/AvatarGroup.svelte'
  import Avatar from '../../src/components/Avatar.svelte'

  let { names = ['A B', 'C D'], max }: { names?: string[]; max?: number } = $props()
  let firstRef = $state<HTMLDivElement | null>(null)
  export const getFirstRef = () => firstRef
</script>

<AvatarGroup {max}>
  {#each names as name, i (name)}
    {#if i === 0}<Avatar {name} bind:ref={firstRef} />{:else}<Avatar {name} />{/if}
  {/each}
</AvatarGroup>
