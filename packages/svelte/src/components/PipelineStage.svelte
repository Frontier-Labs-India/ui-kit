<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import ErrorBoundary from '../lib/ErrorBoundary.svelte'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  export interface Stage {
    id: string
    label: string
    status: 'pending' | 'running' | 'success' | 'failed' | 'skipped'
    duration?: number
  }

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /** The element React's `ref` receives. Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    stages: Stage[]
    orientation?: 'horizontal' | 'vertical'
    onStageClick?: (stageId: string) => void
    motion?: MotionLevel
    class?: string
  }

  const STATUS_ICONS: Record<Stage['status'], string> = {
    pending: '•', running: '▶', success: '✓', failed: '✗', skipped: '−',
  }

  function formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds}s`
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return s > 0 ? `${m}m ${s}s` : `${m}m`
  }

  let { stages, orientation = 'horizontal', onStageClick, motion, class: className, ref = $bindable(null), ...rest }: Props = $props()
  const motionLevel = getMotionLevel(() => motion)
</script>

<ErrorBoundary>
  <div class={cn('ui-pipeline-stage', className)} data-orientation={orientation} data-motion={motionLevel()} bind:this={ref} {...rest}>
    <ol class="ui-pipeline-stage__list">
      {#each stages as stage, i (stage.id)}
        <!-- React: <li style={{display:'contents'}}> — a setProperty call there, a blocked
             static style attribute here, so it is a class carrying the same rule. -->
        <li class="ui-pipeline-stage__li">
          <div class="ui-pipeline-stage__item">
            <div class="ui-pipeline-stage__indicator" data-status={stage.status}>
              <span class="ui-pipeline-stage__icon">{STATUS_ICONS[stage.status]}</span>
            </div>
            <div class="ui-pipeline-stage__content">
              <span class="ui-pipeline-stage__label">
                {#if onStageClick}
                  <button class="ui-pipeline-stage__label-btn" onclick={() => onStageClick(stage.id)}>{stage.label}</button>
                {:else}{stage.label}{/if}
              </span>
              {#if stage.duration !== undefined}<span class="ui-pipeline-stage__duration">{formatDuration(stage.duration)}</span>{/if}
            </div>
          </div>
          {#if i < stages.length - 1}<div class="ui-pipeline-stage__connector" aria-hidden="true"></div>{/if}
        </li>
      {/each}
    </ol>
  </div>
</ErrorBoundary>
