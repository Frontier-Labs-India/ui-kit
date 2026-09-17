<script lang="ts">
  import type { Snippet } from 'svelte'
  import { captureElement, type TriggerProps } from '../lib/trigger-props.js'

  interface Props {
    /** Text shown by the browser's native tooltip (the `title` attribute). */
    content: string
    /** The trigger. Spread the props onto its element: `<button {...props}>`. */
    children: Snippet<[TriggerProps]>
    /** The caller's trigger element (React's NativeTooltip takes no ref). Read it with `bind:ref`. */
    ref?: Element | null
  }

  let { content, children, ref = $bindable(null) }: Props = $props()

  // React clones the child with `title`; see COMPONENT-API.md rule 1.
  const capture = captureElement(el => { ref = el })
  const triggerProps = $derived({ ...capture, title: content })
</script>

{@render children(triggerProps)}
