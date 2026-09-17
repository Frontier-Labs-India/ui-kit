<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import JsonTreeNode from '../lib/JsonTreeNode.svelte'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    data: unknown
    initialExpandDepth?: number
    collapsed?: boolean
    rootName?: string
    enableClipboard?: boolean
    displayDataTypes?: boolean
    displayObjectSize?: boolean
    theme?: 'dark' | 'light' | 'auto'
    indentWidth?: number
    sortKeys?: boolean
    maxStringLength?: number
    motion?: MotionLevel
    class?: string
  }

  let {
    data, initialExpandDepth = 2, collapsed = false, rootName = 'root', enableClipboard = false, displayDataTypes = false,
    displayObjectSize = true, theme = 'dark', indentWidth = 2, sortKeys = false, maxStringLength, motion, class: className, ref = $bindable(null), ...rest
  }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)
  /* 'auto' follows prefers-color-scheme. React calls window.matchMedia without a
   * guard, which throws where it is missing (jsdom, some embedded webviews); this
   * falls back to 'dark' there — what React's server render resolves to. */
  const resolvedTheme = $derived(
    theme !== 'auto' ? theme
      : typeof window !== 'undefined' && window.matchMedia ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : 'dark'
  )
</script>

<div class={cn('ui-json-viewer', className)} data-motion={motionLevel()} data-theme={resolvedTheme} role="group" aria-label={`JSON viewer: ${rootName}`} bind:this={ref} {...rest}>
  <JsonTreeNode
    keyName={rootName}
    value={data}
    depth={0}
    {initialExpandDepth}
    {collapsed}
    {enableClipboard}
    {displayDataTypes}
    {displayObjectSize}
    {indentWidth}
    {sortKeys}
    {maxStringLength}
    isLast
  />
</div>
