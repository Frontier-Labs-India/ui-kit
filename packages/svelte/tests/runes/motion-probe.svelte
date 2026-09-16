<script lang="ts">
  import { getMotionLevel } from '../../src/runes/motion-level.svelte.js'
  let { override }: { override?: 0 | 1 | 2 | 3 } = $props()
  const level = getMotionLevel(() => override)
</script>
<span>{level()}</span>
