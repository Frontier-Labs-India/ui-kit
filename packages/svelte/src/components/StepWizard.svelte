<script lang="ts" module>
  import type { Snippet } from 'svelte'

  export interface Step {
    id: string
    label: string | Snippet
    description?: string | Snippet
    icon?: string | number | Snippet
    validate?: () => boolean | Promise<boolean>
  }
</script>

<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { makeCls, cn } from '../lib/cls.js'
  import Content from '../lib/Content.svelte'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  type Item = Snippet | string | number | boolean | null | undefined

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    steps: Step[]
    activeStep?: number
    defaultStep?: number
    onChange?: (step: number) => void
    orientation?: 'horizontal' | 'vertical'
    allowSkip?: boolean
    /** The content of each step, in order. React takes these as children and
     *  indexes them; a snippet cannot be indexed (COMPONENT-API.md rule 2). */
    items: Item[]
    motion?: MotionLevel
    class?: string
  }

  let {
    steps, activeStep, defaultStep = 0, onChange, orientation = 'horizontal', allowSkip = false, items, motion,
    class: className, ref = $bindable(null), ...rest
  }: Props = $props()

  const cls = makeCls('step-wizard')
  const motionLevel = getMotionLevel(() => motion)
  // svelte-ignore state_referenced_locally
  let internalStep = $state(defaultStep)
  const currentStep = $derived(activeStep ?? internalStep)
  // Children.toArray drops null, undefined and booleans before React indexes.
  const content = $derived(items.filter(i => i != null && typeof i !== 'boolean'))

  async function clickStep(target: number) {
    if (target === currentStep) return
    if (target > currentStep && !allowSkip) return
    if (target > currentStep) {
      const validate = steps[currentStep]?.validate
      if (validate && !(await validate())) return
    }
    if (activeStep === undefined) internalStep = target
    onChange?.(target)
  }

  const stateOf = (idx: number) => (idx < currentStep ? 'completed' : idx === currentStep ? 'active' : 'upcoming')
</script>

<div bind:this={ref} class={cn(cls('root'), className)} data-orientation={orientation} data-motion={motionLevel()} {...rest}
><ol class="ui-step-wizard__steps" role="list">{#each steps as step, idx (step.id)}{@const state = stateOf(idx)}{@const clickable = allowSkip || state === 'completed'}<!-- svelte-ignore a11y_no_redundant_roles (as React) --><li
        class="ui-step-wizard__step"
        role="listitem"
        aria-current={state === 'active' ? 'step' : undefined}
      ><button
          type="button"
          class="ui-step-wizard__step-button"
          data-clickable={clickable || undefined}
          onclick={() => clickStep(idx)}
          tabindex={clickable ? 0 : -1}
        ><span class="ui-step-wizard__indicator" data-state={state}>{#if state === 'completed'}<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M3 7L6 10L11 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>{:else if step.icon}<Content value={step.icon} />{:else}{idx + 1}{/if}</span><span class="ui-step-wizard__label"><span class="ui-step-wizard__label-text"><Content value={step.label} /></span>{#if step.description}<span class="ui-step-wizard__label-desc"><Content value={step.description} /></span>{/if}</span></button>{#if idx < steps.length - 1}<span class="ui-step-wizard__connector" data-filled={idx < currentStep ? 'true' : undefined} aria-hidden="true"></span>{/if}</li>{/each}</ol
  >{#key currentStep}<div class="ui-step-wizard__content"><Content value={content[currentStep]} /></div>{/key}</div>
