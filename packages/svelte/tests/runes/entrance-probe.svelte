<script lang="ts">
  import { useEntrance, type EntranceAnimation } from '../../src/runes/entrance.svelte.js'
  let { animation = 'fade-up', delay = 0, duration = 300 }: { animation?: EntranceAnimation; delay?: number; duration?: number } = $props()
  let el = $state<HTMLElement | null>(null)
  const e = useEntrance(() => el, () => animation, () => ({ delay, duration }))
</script>

<div bind:this={el} data-entered={String(e.entered)}>x</div>
