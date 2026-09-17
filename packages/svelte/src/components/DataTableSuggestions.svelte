<script lang="ts">
  import { SvelteSet } from 'svelte/reactivity'

  /** One suggestion, as src/domain/data-table-ai.ts defines DataInsight. */
  export interface DataInsight {
    id: string
    type: string
    title: string
    description: string
    confidence: number
    icon: string
    apply?: Record<string, unknown>
  }

  interface Props {
    /** The root element, null while no insight is shown (React's takes no ref). Read it with `bind:ref`. */
    ref?: HTMLDivElement | null
    insights: DataInsight[]
    onApply?: (insight: DataInsight) => void
    onDismiss?: (id: string) => void
  }

  const ICONS: Record<string, string> = {
    calculator: 'Σ', 'chart-line': '↑', layers: '≡', search: '⚲', 'alert-triangle': '⚠',
    'trending-up': '↗', filter: '▽', 'badge-check': '◉', list: '☰', 'scatter-chart': '•',
  }

  let { insights, onApply, onDismiss, ref = $bindable(null) }: Props = $props()

  let open = $state(true)
  const dismissed = new SvelteSet<string>()
  const visible = $derived(insights.filter(i => !dismissed.has(i.id)))

  function dismiss(id: string) {
    dismissed.add(id)
    onDismiss?.(id)
  }
</script>

<!-- Renders nothing once every insight is dismissed, as React returns an empty fragment. -->
{#if visible.length > 0}
  <div bind:this={ref} class="ui-data-table-suggestions" role="region" aria-label="AI Suggestions">
    <button type="button" class="ui-data-table-suggestions__header" onclick={() => (open = !open)} aria-expanded={open}>
      <span class="ui-data-table-suggestions__title"><span aria-hidden="true">{'✨'}</span>AI Suggestions<span class="ui-data-table-suggestions__badge">{visible.length}</span></span>
      <span class="ui-data-table-suggestions__toggle" data-open={open ? '' : undefined} aria-hidden="true">{'▼'}</span>
    </button>
    {#if open}
      <div class="ui-data-table-suggestions__list" role="list">
        {#each visible as insight (insight.id)}
          <div class="ui-data-table-suggestions__item" role="listitem">
            <span class="ui-data-table-suggestions__item-icon" aria-hidden="true">{ICONS[insight.icon] ?? '✦'}</span>
            <div class="ui-data-table-suggestions__item-body">
              <div class="ui-data-table-suggestions__item-title">{insight.title}</div>
              <div class="ui-data-table-suggestions__item-desc">{insight.description}</div>
              <div class="ui-data-table-suggestions__item-meta"><span class="ui-data-table-suggestions__confidence">{Math.round(insight.confidence * 100)}%</span></div>
            </div>
            <div class="ui-data-table-suggestions__item-actions">
              {#if insight.apply && onApply}
                <button type="button" class="ui-data-table-suggestions__apply-btn" onclick={() => onApply(insight)} aria-label={`Apply: ${insight.title}`}>Apply</button>
              {/if}
              <button type="button" class="ui-data-table-suggestions__dismiss-btn" onclick={() => dismiss(insight.id)} aria-label={`Dismiss: ${insight.title}`}>{'×'}</button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
{/if}
