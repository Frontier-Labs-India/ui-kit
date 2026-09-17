<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import ErrorBoundary from '../lib/ErrorBoundary.svelte'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  export interface TestStep {
    id: string
    label: string
    status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped'
    message?: string
    duration?: number
  }

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    steps: TestStep[]
    title?: string
    onRetry?: () => void
    onCancel?: () => void
    running?: boolean
    size?: 'sm' | 'md' | 'lg'
    motion?: MotionLevel
    class?: string
  }

  const STATUS_ICONS: Record<TestStep['status'], string> = {
    pending: '•', running: '◦', passed: '✓', failed: '✗', skipped: '−',
  }
  const formatMs = (ms: number) => (ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`)

  let {
    steps, title = 'Connection Test', onRetry, onCancel, running = false, size = 'md', motion, class: className, ref = $bindable(null), ...rest
  }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)
  const count = (s: TestStep['status']) => steps.filter(x => x.status === s).length
</script>

<ErrorBoundary>
  <div class={cn('ui-connection-test-panel', className)} data-size={size} data-motion={motionLevel()} role="region" aria-label={title} bind:this={ref} {...rest}>
    <div class="ui-connection-test-panel__header">
      <span class="ui-connection-test-panel__title">{title}</span>
      <div class="ui-connection-test-panel__actions">
        {#if onCancel && running}
          <button type="button" class="ui-connection-test-panel__btn ui-connection-test-panel__btn--cancel" onclick={onCancel}>Cancel</button>
        {/if}
        {#if onRetry && !running}
          <button type="button" class="ui-connection-test-panel__btn" onclick={onRetry}>&#8635; Retry</button>
        {/if}
      </div>
    </div>
    <ol class="ui-connection-test-panel__steps" aria-label="Test steps">
      {#each steps as step (step.id)}
        <li class="ui-connection-test-panel__step" data-status={step.status}>
          <span class="ui-connection-test-panel__icon" data-status={step.status} aria-hidden="true">{STATUS_ICONS[step.status]}</span>
          <div class="ui-connection-test-panel__content">
            <div class="ui-connection-test-panel__row">
              <span class="ui-connection-test-panel__label">{step.label}</span>
              <span class="ui-connection-test-panel__badge" data-status={step.status}>{step.status}</span>
            </div>
            <div class="ui-connection-test-panel__row">
              {#if step.duration !== undefined}<span class="ui-connection-test-panel__duration">{formatMs(step.duration)}</span>{/if}
            </div>
            {#if step.message}<span class="ui-connection-test-panel__message">{step.message}</span>{/if}
          </div>
        </li>
      {/each}
    </ol>
    <div class="ui-connection-test-panel__footer">
      <div class="ui-connection-test-panel__summary">
        <span class="ui-connection-test-panel__count--passed">{count('passed')} passed</span>
        {#if count('failed') > 0}<span class="ui-connection-test-panel__count--failed">{count('failed')} failed</span>{/if}
        {#if count('skipped') > 0}<span>{count('skipped')} skipped</span>{/if}
      </div>
      <span>{steps.length} total</span>
    </div>
  </div>
</ErrorBoundary>
