<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import ErrorBoundary from '../lib/ErrorBoundary.svelte'
  import { cssProps } from '../actions/css-props.js'
  import { reactStyle } from '../lib/react-style.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  export type RackDeviceStatus = 'ok' | 'warning' | 'critical' | 'empty'
  export interface RackDevice {
    startU: number
    heightU: number
    label: string
    status?: RackDeviceStatus
  }

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    units: number
    devices: RackDevice[]
    showUnitNumbers?: boolean
    orientation?: 'front' | 'rear'
    size?: 'sm' | 'md' | 'lg'
    motion?: MotionLevel
    class?: string
  }

  const UNIT_H = { sm: 10, md: 16, lg: 22 } as const

  let { units, devices, showUnitNumbers = true, orientation = 'front', size = 'md', motion, class: className, ref = $bindable(null), ...rest }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)
  let tooltip = $state<{ device: RackDevice; x: number; y: number } | null>(null)
  const unitH = $derived(UNIT_H[size])
  // Front view numbers top-down from the highest U; rear view from 1.
  const unitNums = $derived(Array.from({ length: units }, (_, i) => (orientation === 'front' ? units - i : i + 1)))
  const topU = (d: RackDevice) => (orientation === 'front' ? units - d.startU - d.heightU + 1 : d.startU - 1)

  function enter(e: MouseEvent, device: RackDevice) {
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    tooltip = { device, x: rect.right, y: rect.top + rect.height / 2 }
  }
</script>

<ErrorBoundary>
  <div class={cn('ui-rack-diagram', className)} data-size={size} data-motion={motionLevel()} role="img" aria-label={`Rack diagram: ${units}U, ${devices.length} devices`} bind:this={ref} {...rest}>
    {#if showUnitNumbers}
      <div class="ui-rack-diagram__numbers">
        {#each unitNums as u (u)}<div class="ui-rack-diagram__number" use:cssProps={reactStyle({ blockSize: unitH })}>{u}</div>{/each}
      </div>
    {/if}
    <div class="ui-rack-diagram__frame" use:cssProps={reactStyle({ blockSize: units * unitH })}>
      {#each unitNums as u (u)}<div class="ui-rack-diagram__slot"></div>{/each}
      {#each devices as dev (`${dev.startU}-${dev.label}`)}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="ui-rack-diagram__device"
          data-status={dev.status ?? 'ok'}
          use:cssProps={reactStyle({ top: topU(dev) * unitH + 1, blockSize: dev.heightU * unitH - 2 })}
          onmouseenter={e => enter(e, dev)}
          onmouseleave={() => (tooltip = null)}
        >{dev.label}</div>
      {/each}
    </div>
    {#if tooltip}
      <div class="ui-rack-diagram__tooltip" use:cssProps={reactStyle({ left: tooltip.x, top: tooltip.y })}>{tooltip.device.label} — U{tooltip.device.startU}{tooltip.device.heightU > 1 ? `-${tooltip.device.startU + tooltip.device.heightU - 1}` : ''} ({tooltip.device.status ?? 'ok'})</div>
    {/if}
  </div>
</ErrorBoundary>
