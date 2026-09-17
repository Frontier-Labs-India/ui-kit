<script lang="ts">
  import { useFocusTrap } from '../../src/runes/focus-trap.svelte.js'
  let { active = false, returnFocus = true, useInitial = false }: { active?: boolean; returnFocus?: boolean; useInitial?: boolean } = $props()
  let box = $state<HTMLDivElement | null>(null)
  let second = $state<HTMLInputElement | null>(null)
  useFocusTrap(() => box, () => ({ active, returnFocus, initialFocus: useInitial ? () => second : 'first' }))
</script>

<button class="outside">outside</button>
<div bind:this={box}>
  <button class="one">one</button>
  <button disabled>disabled</button>
  <input class="two" bind:this={second} />
  <a href="#x" class="three">three</a>
</div>
