<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import Content from '../lib/Content.svelte'
  import ErrorBoundary from '../lib/ErrorBoundary.svelte'
  import { useEntrance } from '../runes/entrance.svelte.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  type Node = string | number | Snippet

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
    title: Node
    value: Node
    change?: { value: number; period?: string }
    trend?: 'up' | 'down' | 'flat'
    status?: 'ok' | 'warning' | 'critical'
    icon?: Node
    sparkline?: number[]
    loading?: boolean
    error?: Node
    empty?: Node
    motion?: MotionLevel
    class?: string
  }

  let {
    title, value, change, trend, status, icon, sparkline, loading, error, empty, motion, class: className, ...rest
  }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)
  let el = $state<HTMLDivElement | null>(null)
  useEntrance(() => el, () => (motionLevel() >= 2 ? 'fade-up' : 'none'), () => ({ duration: 280 }))

  const showError = $derived(error !== undefined)
  // `!value`, as React: a value of 0 is falsy, so 0 with `empty` set shows the
  // empty state. Inherited, and pinned by a case rather than silently corrected.
  const showEmpty = $derived(!showError && empty !== undefined && !value)
  const ARROWS = { up: '↑', down: '↓', flat: '→' } as const

  const spark = $derived.by(() => {
    if (!sparkline || sparkline.length < 2) return null
    const min = Math.min(...sparkline), max = Math.max(...sparkline)
    const range = max - min || 1
    const w = 100, h = 24, pad = 1
    const pts = sparkline.map((v, i) => ({ x: (i / (sparkline.length - 1)) * w, y: h - pad - ((v - min) / range) * (h - pad * 2) }))
    let d = `M ${pts[0].x} ${pts[0].y}`
    for (let i = 1; i < pts.length; i++) d += ` Q ${(pts[i - 1].x + pts[i].x) / 2} ${pts[i - 1].y}, ${pts[i].x} ${pts[i].y}`
    return { d, area: `${d} L ${pts[pts.length - 1].x} ${h} L ${pts[0].x} ${h} Z` }
  })
</script>

<ErrorBoundary>
  <div
    bind:this={el}
    class={cn('ui-metric-card', className)}
    data-motion={motionLevel()}
    data-status={status || undefined}
    data-loading={loading ? '' : undefined}
    role="group"
    aria-label={typeof title === 'string' ? title : undefined}
    {...rest}
  >
    {#if status}<span class="ui-metric-card__status-dot" data-status={status} aria-hidden="true"></span>{/if}
    <div class="ui-metric-card__header">
      {#if icon}<span class="ui-metric-card__icon"><Content value={icon} /></span>{/if}
      <h3 class="ui-metric-card__title"><Content value={title} /></h3>
    </div>
    {#if showError}<div class="ui-metric-card__error"><Content value={error} /></div>
    {:else if showEmpty}<div class="ui-metric-card__empty"><Content value={empty} /></div>
    {:else}<div class="ui-metric-card__value">{#if loading}{' '}{:else}<Content {value} />{/if}</div>{/if}
    {#if !showError && (change || trend)}
      <div class="ui-metric-card__change">
        {#if trend}<span class="ui-metric-card__trend" data-trend={trend} aria-label={`Trend: ${trend}`}>{ARROWS[trend]}</span>{/if}
        {#if change}<span class="ui-metric-card__change-value" data-direction={change.value > 0 ? 'positive' : change.value < 0 ? 'negative' : 'zero'}>{change.value > 0 ? '+' : ''}{change.value}%</span>{/if}
        {#if change?.period}<span class="ui-metric-card__change-period">vs {change.period}</span>{/if}
      </div>
    {/if}
    {#if spark && !showError && !showEmpty}
      <div class="ui-metric-card__sparkline">
        <!-- id="sparkline-fill" is fixed, as in React: two cards with sparklines on
             one page share the id. Inherited; recorded, not changed here. -->
        <svg viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="sparkline-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="oklch(65% 0.2 270)" stop-opacity="0.3" />
              <stop offset="100%" stop-color="oklch(65% 0.2 270)" stop-opacity="0" />
            </linearGradient>
          </defs>
          <path d={spark.area} fill="url(#sparkline-fill)" />
          <path d={spark.d} fill="none" stroke="oklch(65% 0.2 270)" stroke-width="1.5" />
        </svg>
      </div>
    {/if}
  </div>
</ErrorBoundary>
