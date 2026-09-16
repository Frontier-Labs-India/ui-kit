<script lang="ts">
  import type { SVGAttributes } from 'svelte/elements'
  import { iconPaths } from '../vendor/core/icons/paths.js'

  /* Svelte twin of Icon (src/core/icons/icon.tsx). The path data is vendored
   * from the React package, so both render the same ~50 icons from one source. */

  export type IconSize = 'sm' | 'md' | 'lg' | number

  interface Props extends SVGAttributes<SVGSVGElement> {
    name: string
    /** 'sm' (16px), 'md' (20px), 'lg' (24px), or a number. */
    size?: IconSize
    /** With a label the icon is role="img"; without one it is aria-hidden. */
    label?: string
    class?: string
  }

  const SIZE_MAP = { sm: 16, md: 20, lg: 24 } as const

  let { name, size = 'md', label, class: className, ...rest }: Props = $props()

  const paths = $derived(iconPaths[name])
  const px = $derived(typeof size === 'number' ? size : SIZE_MAP[size])
</script>

{#if paths}
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={px}
    height={px}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width={2}
    stroke-linecap="round"
    stroke-linejoin="round"
    class={className}
    role={label ? 'img' : undefined}
    aria-label={label || undefined}
    aria-hidden={label ? undefined : true}
    {...rest}
  >
    {#each paths as d, i (i)}<path {d} />{/each}
  </svg>
{/if}
