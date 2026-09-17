<script lang="ts">
  import type { HTMLButtonAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'
  import { cssProps } from '../actions/css-props.js'
  import { mergeStyles, type StyleInput } from '../lib/react-style.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends Omit<HTMLButtonAttributes, 'style'> {
    visibleFrom?: number
    smooth?: boolean
    /** A scrolling element to watch instead of the window. */
    target?: HTMLElement | null
    showProgress?: boolean
    size?: 'sm' | 'md' | 'lg'
    motion?: MotionLevel
    class?: string
    style?: StyleInput
  }

  let { visibleFrom = 400, smooth = true, target, showProgress = false, size = 'md', motion, class: className, style, ...rest }: Props = $props()

  const SIZE_MAP = { sm: 36, md: 44, lg: 56 } as const
  const ICON_MAP = { sm: 16, md: 20, lg: 24 } as const

  const cls = makeCls('back-to-top')
  const motionLevel = getMotionLevel(() => motion)
  let visible = $state(false)
  let progress = $state(0)

  $effect(() => {
    const el = target ?? null
    const from = visibleFrom
    const withProgress = showProgress
    const scrollTarget: HTMLElement | Window = el ?? window
    const onScroll = () => {
      const top = el ? el.scrollTop : window.scrollY
      const height = el ? el.scrollHeight - el.clientHeight : document.documentElement.scrollHeight - window.innerHeight
      visible = top > from
      if (withProgress) progress = Math.min(top / Math.max(height, 1), 1)
    }
    scrollTarget.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => scrollTarget.removeEventListener('scroll', onScroll)
  })

  /* React spreads the caller's props after its own onClick, so a caller onClick
   * replaces this handler (no scroll). The same order is kept here: an
   * `onclick` in rest wins. Inherited, recorded for a fix in both packages. */
  function handleClick(e: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
    ;(target ?? window).scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'instant' })
    rest.onclick?.(e)
  }

  const dimension = $derived(SIZE_MAP[size])
  const iconSize = $derived(ICON_MAP[size])
  const radius = $derived((dimension - 2) / 2)
  const circumference = $derived(2 * Math.PI * radius)
  const styles = $derived(mergeStyles({ inlineSize: `${dimension}px`, blockSize: `${dimension}px` }, style))
</script>

<button
  type="button"
  class={cn(cls('root'), className)}
  data-visible={visible}
  data-motion={motionLevel()}
  use:cssProps={styles}
  onclick={handleClick}
  aria-label="Back to top"
  {...rest}
>
  {#if showProgress}
    <svg class="ui-back-to-top__progress" viewBox={`0 0 ${dimension} ${dimension}`} width={dimension} height={dimension}>
      <circle class="ui-back-to-top__progress-track" cx={dimension / 2} cy={dimension / 2} r={radius} stroke-width={2} />
      <circle class="ui-back-to-top__progress-fill" cx={dimension / 2} cy={dimension / 2} r={radius} stroke-width={2}
        stroke-dasharray={circumference} stroke-dashoffset={circumference * (1 - progress)} transform={`rotate(-90 ${dimension / 2} ${dimension / 2})`} />
    </svg>
  {/if}
  <span class="ui-back-to-top__icon">
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 19V5m0 0l-7 7m7-7l7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  </span>
</button>
