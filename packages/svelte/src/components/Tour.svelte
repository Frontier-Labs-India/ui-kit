<script module lang="ts">
  import type { Snippet } from 'svelte'

  export interface TourStep {
    /** A CSS selector for the element to highlight. */
    target: string
    title: string
    description: string | Snippet
    placement?: 'top' | 'bottom' | 'left' | 'right'
    onShow?: () => void
  }
</script>

<script lang="ts">
  import { untrack } from 'svelte'
  import Content from '../lib/Content.svelte'
  import { cssProps } from '../actions/css-props.js'
  import { reactStyle } from '../lib/react-style.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props {
    /** The tour overlay element, null while closed (React's Tour takes no ref). Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    steps: TourStep[]
    open?: boolean
    onClose?: () => void
    onFinish?: () => void
    /** Controlled step; omit to step internally. */
    currentStep?: number
    onStepChange?: (step: number) => void
    closeOnOverlay?: boolean
    closeOnEscape?: boolean
    showProgress?: boolean
    showSkip?: boolean
    motion?: MotionLevel
  }

  let {
    steps, open = false, onClose, onFinish, currentStep, onStepChange, closeOnOverlay = true, closeOnEscape = true,
    showProgress = true, showSkip = true, motion, ref = $bindable(null),
  }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)
  let internalStep = $state(0)
  const step = $derived(currentStep !== undefined ? currentStep : internalStep)
  let spotlight = $state<{ x: number; y: number; width: number; height: number } | null>(null)
  let tooltipPos = $state({ top: 0, left: 0 })
  let entering = $state(false)
  let targetNotFound = $state(false)
  let tooltip = $state<HTMLDivElement | null>(null)

  const data = $derived(steps[step])
  const isFirst = $derived(step === 0)
  const isLast = $derived(step === steps.length - 1)

  function goTo(i: number) {
    if (currentStep === undefined) internalStep = i
    onStepChange?.(i)
  }
  function next() {
    if (isLast) {
      onFinish?.()
      onClose?.()
    } else goTo(step + 1)
  }

  $effect(() => {
    if (!open || !closeOnEscape) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  })

  /* On opening and on each step: spotlight the target (padded 8px), place the
   * tooltip on its side (16px gap, clamped 8px inside the viewport) — or
   * centre it with a notice when the target is missing — re-placed 100ms
   * after scroll, resize or target resize, and call the step's onShow. */
  $effect(() => {
    const current = data
    if (!open || !current) return
    return untrack(() => {
      entering = true
      targetNotFound = false
      const enteringTimer = setTimeout(() => { entering = false }, 300)
      let debounce: ReturnType<typeof setTimeout> | null = null

      const place = () => {
        const target = document.querySelector(current.target)
        const w = tooltip?.offsetWidth ?? 320
        const h = tooltip?.offsetHeight ?? 200
        if (!target) {
          spotlight = null
          targetNotFound = true
          tooltipPos = { top: window.innerHeight / 2 - h / 2, left: window.innerWidth / 2 - w / 2 }
          return
        }
        targetNotFound = false
        const rect = target.getBoundingClientRect()
        spotlight = { x: rect.left - 8, y: rect.top - 8, width: rect.width + 16, height: rect.height + 16 }
        if (rect.top < 0 || rect.bottom > window.innerHeight) target.scrollIntoView({ behavior: 'smooth', block: 'center' })
        let top = 0
        let left = 0
        switch (current.placement || 'bottom') {
          case 'bottom': top = rect.bottom + 16; left = rect.left + rect.width / 2 - w / 2; break
          case 'top': top = rect.top - h - 16; left = rect.left + rect.width / 2 - w / 2; break
          case 'right': top = rect.top + rect.height / 2 - h / 2; left = rect.right + 16; break
          case 'left': top = rect.top + rect.height / 2 - h / 2; left = rect.left - w - 16; break
        }
        tooltipPos = {
          top: Math.max(8, Math.min(top, window.innerHeight - h - 8)),
          left: Math.max(8, Math.min(left, window.innerWidth - w - 8)),
        }
      }
      const later = () => {
        if (debounce) clearTimeout(debounce)
        debounce = setTimeout(place, 100)
      }

      place()
      const observer = new ResizeObserver(later)
      const target = document.querySelector(current.target)
      if (target) observer.observe(target)
      window.addEventListener('scroll', later, true)
      window.addEventListener('resize', later)
      current.onShow?.()
      return () => {
        clearTimeout(enteringTimer)
        if (debounce) clearTimeout(debounce)
        observer.disconnect()
        window.removeEventListener('scroll', later, true)
        window.removeEventListener('resize', later)
      }
    })
  })
</script>

{#if open && data}
  <div bind:this={ref} class="ui-tour" data-motion={motionLevel()} data-open="" role="dialog" aria-modal="true" aria-label={`Tour step ${step + 1} of ${steps.length}: ${data.title}`}>
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <svg class="ui-tour__overlay" onclick={() => { if (closeOnOverlay) onClose?.() }} aria-hidden="true">
      <defs>
        <mask id="ui-tour-mask">
          <rect x="0" y="0" width="100%" height="100%" fill="white" />
          {#if spotlight}<rect x={spotlight.x} y={spotlight.y} width={spotlight.width} height={spotlight.height} rx={8} ry={8} fill="black" class="ui-tour__spotlight" />{/if}
        </mask>
      </defs>
      <rect x="0" y="0" width="100%" height="100%" class="ui-tour__overlay-bg" mask="url(#ui-tour-mask)" />
    </svg>
    <div bind:this={tooltip} class="ui-tour__tooltip" use:cssProps={reactStyle({ top: tooltipPos.top, left: tooltipPos.left })} role="status" data-entering={entering ? '' : undefined}>
      <h3 class="ui-tour__title">{data.title}</h3>
      {#if targetNotFound}<div class="ui-tour__description" use:cssProps={{ color: 'oklch(80% 0.15 60)' }}>Target element not found. It may not be visible on the page.</div>{/if}
      <div class="ui-tour__description"><Content value={data.description} /></div>
      <div class="ui-tour__footer">
        {#if showProgress}<span class="ui-tour__progress">Step {step + 1} of {steps.length}</span>{/if}
        <div class="ui-tour__dots" aria-hidden="true">
          {#each steps as _, idx}<span class="ui-tour__dot" data-active={idx === step ? '' : undefined} data-completed={idx < step ? '' : undefined}></span>{/each}
        </div>
        <div class="ui-tour__actions">
          {#if showSkip && !isLast}<button class="ui-tour__btn" data-skip="" onclick={() => onClose?.()} type="button">Skip</button>{/if}
          {#if !isFirst}<button class="ui-tour__btn" onclick={() => { if (!isFirst) goTo(step - 1) }} type="button">Previous</button>{/if}
          <button class="ui-tour__btn" data-primary="" onclick={next} type="button">{isLast ? 'Finish' : 'Next'}</button>
        </div>
      </div>
    </div>
  </div>
{/if}
