<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import { cssProps } from '../actions/css-props.js'
  import { mergeStyles, reactStyle, type StyleInput } from '../lib/react-style.js'
  import { seededRandom } from '../lib/seeded-random.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'style'> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    waveCount?: number
    speed?: number
    color?: string
    children?: Snippet
    motion?: MotionLevel
    style?: StyleInput
    class?: string
  }

  let { waveCount = 5, speed = 10, color, children, motion, class: className, style, ref = $bindable(null), ...rest }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)

  function wavePath(index: number, total: number, width: number, height: number): string {
    const amplitude = 15 + seededRandom(index + 10) * 25
    const frequency = 2 + seededRandom(index + 20) * 2
    const yBase = (height * (index + 1)) / (total + 1)
    const points: string[] = []
    const steps = 100
    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * width * 2 // double width for a seamless loop
      const y = yBase + Math.sin((i / steps) * Math.PI * 2 * frequency) * amplitude
      points.push(i === 0 ? `M ${x},${y}` : `L ${x},${y}`)
    }
    points.push(`L ${width * 2},${height}`, `L 0,${height}`, 'Z')
    return points.join(' ')
  }

  const waves = $derived(Array.from({ length: waveCount }, (_, i) => ({
    path: wavePath(i, waveCount, 800, 400),
    opacity: 0.1 + seededRandom(i + 30) * 0.15,
    style: reactStyle({
      '--wave-speed': `${speed * (0.8 + seededRandom(i + 40) * 0.6)}s`,
      '--wave-delay': `${seededRandom(i + 50) * speed * 0.5}s`,
    }),
  })))
  const baseColor = $derived(color || 'oklch(75% 0.15 270)')
  const styles = $derived(mergeStyles(style))
</script>

<div class={cn('ui-wavy-background', className)} data-motion={motionLevel()} use:cssProps={styles} bind:this={ref} {...rest}>
  <svg class="ui-wavy-background--svg" viewBox="0 0 800 400" preserveAspectRatio="none" aria-hidden="true">
    {#each waves as wave, i (i)}
      <path class="ui-wavy-background--wave" d={wave.path} fill={baseColor} fill-opacity={wave.opacity} use:cssProps={wave.style} />
    {/each}
  </svg>
  {#if children}<div class="ui-wavy-background--content">{@render children()}</div>{/if}
</div>
