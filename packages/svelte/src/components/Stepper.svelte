<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'
  import Content from '../lib/Content.svelte'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  export interface StepperStep {
    id: string
    label: string | Snippet
    description?: string
    icon?: string | Snippet
    optional?: boolean
  }

  interface Props extends HTMLAttributes<HTMLDivElement> {
    steps: StepperStep[]
    activeStep: number
    orientation?: 'horizontal' | 'vertical'
    variant?: 'default' | 'dots' | 'progress'
    size?: 'sm' | 'md' | 'lg'
    onStepClick?: (step: number) => void
    motion?: MotionLevel
    class?: string
  }

  let {
    steps, activeStep, orientation = 'horizontal', variant = 'default', size = 'md', onStepClick, motion,
    class: className, ...rest
  }: Props = $props()

  const cls = makeCls('stepper')
  const motionLevel = getMotionLevel(() => motion)
  const clickable = $derived(!!onStepClick)
  const status = (i: number) => (i < activeStep ? 'completed' : i === activeStep ? 'active' : 'pending')

  function keydown(e: KeyboardEvent, i: number) {
    if (onStepClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      onStepClick(i)
    }
  }
</script>

{#snippet indicator(step: StepperStep, i: number)}
  <span class="ui-stepper__indicator">
    <span class="ui-stepper__indicator-content">
      {#if status(i) === 'completed' && !step.icon}
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      {:else if step.icon}<Content value={step.icon} />{:else}{i + 1}{/if}
    </span>
  </span>
{/snippet}

{#snippet labels(step: StepperStep)}
  <div class="ui-stepper__label-group">
    <span class="ui-stepper__label"><Content value={step.label} /></span>
    {#if step.description}<span class="ui-stepper__description">{step.description}</span>{/if}
    {#if step.optional}<span class="ui-stepper__optional">Optional</span>{/if}
  </div>
{/snippet}

{#snippet connector(i: number)}
  <div class="ui-stepper__connector" data-completed={i < activeStep || undefined} aria-hidden="true"></div>
{/snippet}

<div
  class={cn(cls('root'), className)}
  data-orientation={orientation}
  data-variant={variant}
  data-size={size}
  data-motion={motionLevel()}
  aria-label="Progress steps"
  role="navigation"
  {...rest}
>
  {#each steps as step, i (step.id)}
    <!-- tabindex and role="button" are set together from the same `clickable`
         flag, so a focusable step is always a button — the analyser cannot see
         the pairing through the conditional. Same markup as React. -->
    <!-- svelte-ignore a11y_no_static_element_interactions, a11y_no_noninteractive_tabindex -->
    <div
      class="ui-stepper__step"
      data-status={status(i)}
      data-clickable={clickable || undefined}
      role={clickable ? 'button' : undefined}
      tabindex={clickable ? 0 : undefined}
      aria-current={status(i) === 'active' ? 'step' : undefined}
      onclick={clickable ? () => onStepClick!(i) : undefined}
      onkeydown={clickable ? e => keydown(e, i) : undefined}
    >
      {#if orientation === 'horizontal'}
        <div class="ui-stepper__step-content">{@render indicator(step, i)}{@render labels(step)}</div>
        {#if i < steps.length - 1}{@render connector(i)}{/if}
      {:else}
        <div class="ui-stepper__step-wrapper">{@render indicator(step, i)}{#if i < steps.length - 1}{@render connector(i)}{/if}</div>
        {@render labels(step)}
      {/if}
    </div>
  {/each}
</div>
