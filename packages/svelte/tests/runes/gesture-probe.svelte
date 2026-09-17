<script lang="ts">
  import { useGesture, type GestureHandlers } from '../../src/runes/gesture.svelte.js'
  let { handlers }: { handlers: GestureHandlers } = $props()
  let el = $state<HTMLDivElement | null>(null)
  useGesture(() => el, () => handlers)
</script>

<div bind:this={el} class="g"></div>
