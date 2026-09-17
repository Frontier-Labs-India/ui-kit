<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'
  import Content from '../lib/Content.svelte'
  import { cssProps } from '../actions/css-props.js'
  import { reactStyle, mergeStyles, type StyleInput } from '../lib/react-style.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  type Item = Snippet | string | number | boolean | null | undefined

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'style'> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    /** The slides, in order. React takes these as children and counts them;
     *  a snippet cannot be counted (COMPONENT-API.md rule 2). */
    items: Item[]
    autoPlay?: boolean
    autoPlayInterval?: number
    showArrows?: boolean
    showDots?: boolean
    loop?: boolean
    slidesPerView?: number
    gap?: number | string
    motion?: MotionLevel
    class?: string
    style?: StyleInput
  }

  let {
    items, autoPlay = false, autoPlayInterval = 5000, showArrows = true, showDots = true, loop = false, slidesPerView = 1,
    gap = 0, motion, class: className, style, ref = $bindable(null), ...rest
  }: Props = $props()

  const cls = makeCls('carousel')
  const motionLevel = getMotionLevel(() => motion)
  let track = $state<HTMLDivElement | null>(null)
  let currentIndex = $state(0)
  let isPaused = $state(false)
  let autoPlayTimer: ReturnType<typeof setInterval> | null = null

  // Children.toArray drops null, undefined and booleans before React counts.
  const slides = $derived(items.filter(i => i != null && typeof i !== 'boolean'))
  const totalPages = $derived(Math.max(1, Math.ceil(slides.length / slidesPerView)))
  const gapValue = $derived(typeof gap === 'number' ? `${gap}px` : gap)

  function scrollToIndex(index: number) {
    if (!track) return
    const slideEls = track.querySelectorAll<HTMLElement>('.ui-carousel__slide')
    if (!slideEls.length) return
    const target = slideEls[Math.min(index * slidesPerView, slideEls.length - 1)]
    if (!target) return
    track.scrollTo({ left: target.offsetLeft - track.offsetLeft, behavior: motionLevel() === 0 ? 'auto' : 'smooth' })
  }

  function goTo(index: number) {
    let next = index
    if (loop) {
      if (next < 0) next = totalPages - 1
      else if (next >= totalPages) next = 0
    } else {
      next = Math.max(0, Math.min(next, totalPages - 1))
    }
    currentIndex = next
    scrollToIndex(next)
    if (autoPlayTimer) { clearInterval(autoPlayTimer); autoPlayTimer = null }
  }

  // After scrolling settles, the page is the one whose slide is closest, as in React.
  $effect(() => {
    const el = track
    const perView = slidesPerView
    if (!el) return
    let timer: ReturnType<typeof setTimeout>
    const onScroll = () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        const slideEls = el.querySelectorAll<HTMLElement>('.ui-carousel__slide')
        if (!slideEls.length) return
        const left = el.scrollLeft + el.offsetLeft
        let closest = 0
        let closestDist = Infinity
        slideEls.forEach((s, i) => {
          const dist = Math.abs(s.offsetLeft - left)
          if (dist < closestDist) { closestDist = dist; closest = i }
        })
        currentIndex = Math.floor(closest / perView)
      }, 50)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => { el.removeEventListener('scroll', onScroll); clearTimeout(timer) }
  })

  // Restarted on every page change, as React's effect depends on currentIndex.
  $effect(() => {
    const index = currentIndex
    if (!autoPlay || isPaused || totalPages <= 1) return
    autoPlayTimer = setInterval(() => goTo(index + 1), autoPlayInterval)
    return () => { if (autoPlayTimer) { clearInterval(autoPlayTimer); autoPlayTimer = null } }
  })

  function onkeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(currentIndex - 1) }
    else if (e.key === 'ArrowRight') { e.preventDefault(); goTo(currentIndex + 1) }
    else if (e.key === 'Home') { e.preventDefault(); goTo(0) }
    else if (e.key === 'End') { e.preventDefault(); goTo(totalPages - 1) }
  }

  const prevDisabled = $derived(!loop && currentIndex === 0)
  const nextDisabled = $derived(!loop && currentIndex >= totalPages - 1)
  const basis = $derived(slidesPerView > 1 ? `calc((100% - ${gapValue} * ${slidesPerView - 1}) / ${slidesPerView})` : '100%')
</script>

<!-- Handlers before the spread: React spreads caller props last, so a caller's
     onmouseenter/onkeydown replaces these, as there. -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions (as React) -->
<div
  bind:this={ref}
  class={cn(cls('root'), className)}
  data-motion={motionLevel()}
  role="region"
  aria-roledescription="carousel"
  aria-label={rest['aria-label'] ?? 'Carousel'}
  onmouseenter={() => { isPaused = true }}
  onmouseleave={() => { isPaused = false }}
  {onkeydown}
  tabindex="0"
  use:cssProps={mergeStyles(style)}
  {...rest}
><div bind:this={track} class="ui-carousel__track" aria-live={autoPlay ? 'off' : 'polite'} use:cssProps={reactStyle({ gap: gapValue })}>{#each slides as slide, i (i)}<div
        class="ui-carousel__slide"
        role="group"
        aria-roledescription="slide"
        aria-label={`Slide ${i + 1} of ${slides.length}`}
        use:cssProps={reactStyle({ flexBasis: basis })}
      ><Content value={slide} /></div>{/each}</div>{#if showArrows && totalPages > 1}<div class="ui-carousel__arrows" aria-hidden="true"><button type="button" class="ui-carousel__arrow ui-carousel__arrow--prev" onclick={() => goTo(currentIndex - 1)} disabled={prevDisabled} aria-label="Previous slide" tabindex="-1"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6" /></svg></button><button type="button" class="ui-carousel__arrow ui-carousel__arrow--next" onclick={() => goTo(currentIndex + 1)} disabled={nextDisabled} aria-label="Next slide" tabindex="-1"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6" /></svg></button></div>{/if}{#if showDots && totalPages > 1}<div class="ui-carousel__dots" role="tablist" aria-label="Slides">{#each { length: totalPages } as _, i (i)}<button
          type="button"
          class="ui-carousel__dot"
          role="tab"
          aria-selected={i === currentIndex}
          aria-label={`Go to slide ${i + 1}`}
          data-active={i === currentIndex ? '' : undefined}
          onclick={() => goTo(i)}
          tabindex={i === currentIndex ? 0 : -1}
        ></button>{/each}</div>{/if}<div class="ui-carousel__live" aria-live="polite" aria-atomic="true">{`Slide ${currentIndex + 1} of ${totalPages}`}</div></div>
