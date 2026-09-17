<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends HTMLAttributes<HTMLSpanElement> {
    words: string[]
    interval?: number
    motion?: MotionLevel
    class?: string
  }

  let { words, interval = 3000, motion, class: className, ...rest }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)
  let currentIndex = $state(0)
  let phase = $state<'entering' | 'visible' | 'exiting'>('visible')
  const safeWords = $derived(words.length > 0 ? words : [''])

  /* Every `interval`: exit (400ms, the CSS transition), swap the word and enter,
   * then settle visible 50ms later so the transition runs. */
  $effect(() => {
    const count = safeWords.length
    const every = interval
    if (motionLevel() === 0 || count <= 1) return
    let timer: ReturnType<typeof setTimeout> | undefined
    const cycle = () => {
      phase = 'exiting'
      timer = setTimeout(() => {
        currentIndex = (currentIndex + 1) % count
        phase = 'entering'
        timer = setTimeout(() => { phase = 'visible' }, 50)
      }, 400)
    }
    const main = setInterval(cycle, every)
    return () => {
      clearInterval(main)
      if (timer) clearTimeout(timer)
    }
  })
</script>

<span class={cn('ui-flip-words', className)} data-motion={motionLevel()} aria-live="polite" aria-atomic="true" {...rest}>
  <span class="ui-flip-words--word" data-state={motionLevel() === 0 ? 'visible' : phase}>{safeWords[currentIndex]}</span>
</span>
