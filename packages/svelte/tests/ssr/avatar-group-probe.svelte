<script lang="ts">
  import AvatarGroup from '../../src/components/AvatarGroup.svelte'
  import Avatar from '../../src/components/Avatar.svelte'
</script>

<AvatarGroup max={2} size="sm">
  <Avatar name="Ada Lovelace" />
  <Avatar name="Grace Hopper" />
  <Avatar name="Katherine Johnson" />
</AvatarGroup>
