<script lang="ts">
  import type { Snippet } from 'svelte'
  import { getDropdownMenuContext } from '../lib/dropdown-menu-context.js'
  import { captureElement, type TriggerProps } from '../lib/trigger-props.js'

  interface Props {
    /** The trigger element (React's DropdownMenuTrigger takes no ref). Read it with `bind:ref`. */
    ref?: Element | null
    /** The trigger. Spread the props onto its element: `<button {...props}>`. */
    children: Snippet<[TriggerProps]>
  }

  let { children, ref = $bindable(null) }: Props = $props()
  const ctx = getDropdownMenuContext()

  // Outside a menu React still clones the child, with aria-expanded="false" and aria-haspopup.
  const capture = captureElement(el => { ref = el })
  const triggerProps = $derived(ctx
    ? { ...ctx.triggerProps, ...capture }
    : { ...capture, 'aria-expanded': 'false', 'aria-haspopup': 'menu', onclick: () => {} })
</script>

{@render children(triggerProps)}
