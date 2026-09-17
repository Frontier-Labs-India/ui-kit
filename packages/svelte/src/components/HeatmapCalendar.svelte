<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '../lib/cls.js'
  import ErrorBoundary from '../lib/ErrorBoundary.svelte'
  import { cssProps } from '../actions/css-props.js'
  import { reactStyle } from '../lib/react-style.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  export interface HeatmapData {
    date: string
    value: number
  }

  interface Props extends HTMLAttributes<HTMLDivElement> {
    data: HeatmapData[]
    colorScale?: [string, string]
    startDate?: string
    endDate?: string
    showTooltip?: boolean
    onDateClick?: (date: string) => void
    motion?: MotionLevel
    class?: string
  }

  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const parse = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d) }
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  let { data, colorScale, startDate, endDate, showTooltip = false, onDateClick, motion, class: className, ...rest }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)
  let hovered = $state<string | null>(null)
  const low = $derived(colorScale?.[0] ?? 'oklch(22% 0.02 270)')
  const high = $derived(colorScale?.[1] ?? 'oklch(65% 0.2 155)')

  // Weeks from the Sunday on or before the start, through the end; days outside
  // the range, or without data, render as empty cells — as React builds them.
  const layout = $derived.by(() => {
    if (data.length === 0) return { weeks: [] as { days: { date: string; value: number | null }[]; month: number }[], max: 0 }
    const values = new Map(data.map(d => [d.date, d.value]))
    const dates = data.map(d => d.date).sort()
    const start = startDate ? parse(startDate) : parse(dates[0])
    const end = endDate ? parse(endDate) : parse(dates[dates.length - 1])
    const cur = new Date(start)
    cur.setDate(cur.getDate() - cur.getDay())
    const weeks = []
    while (cur <= end) {
      const month = cur.getMonth()
      const days = []
      for (let i = 0; i < 7; i++) {
        const inRange = cur >= start && cur <= end
        days.push({ date: fmt(cur), value: inRange ? (values.get(fmt(cur)) ?? null) : null })
        cur.setDate(cur.getDate() + 1)
      }
      weeks.push({ days, month })
    }
    return { weeks, max: Math.max(...data.map(d => d.value), 1) }
  })
  // A month label on each week whose first day starts a new month.
  const labelled = $derived(layout.weeks.map((w, i) => (i === 0 || w.month !== layout.weeks[i - 1].month ? MONTHS[w.month] : null)))

  function color(value: number): string {
    if (value === 0) return low
    const ratio = Math.max(0, Math.min(1, layout.max > 0 ? value / layout.max : 0))
    return ratio === 0 ? low : `color-mix(in oklch, ${high} ${Math.round(ratio * 100)}%, ${low})`
  }
</script>

<ErrorBoundary>
  <div class={cn('ui-heatmap-calendar', className)} data-motion={motionLevel()} role="group" aria-label="Activity heatmap" {...rest}>
    <div class="ui-heatmap-calendar__wrapper">
      <div class="ui-heatmap-calendar__day-labels">
        {#each [0, 1, 2, 3, 4, 5, 6] as dow (dow)}<div class="ui-heatmap-calendar__day-label">{dow % 2 === 1 ? DAY_NAMES[dow].charAt(0) : ''}</div>{/each}
      </div>
      <div class="ui-heatmap-calendar__grid">
        {#each layout.weeks as week, wi (wi)}
          <div class="ui-heatmap-calendar__week">
            {#if labelled[wi]}<div class="ui-heatmap-calendar__month-label">{labelled[wi]}</div>{/if}
            {#each week.days as day, di (di)}
              {#if day.value === null}
                <div class="ui-heatmap-calendar__cell ui-heatmap-calendar__cell--empty"></div>
              {:else}
                {@const v = day.value}
                <!-- DEFECT inherited from React, kept for markup parity: with onDateClick the
                     cells are clickable role="img" elements with no tabindex or key handler,
                     so a date cannot be chosen from the keyboard. Fix in both packages. -->
                <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
                <div
                  class="ui-heatmap-calendar__cell"
                  use:cssProps={reactStyle({ background: color(v) })}
                  role="img"
                  aria-label={`${day.date}: ${v}`}
                  data-clickable={onDateClick ? '' : undefined}
                  onclick={onDateClick ? () => onDateClick(day.date) : undefined}
                  onmouseenter={showTooltip ? () => (hovered = day.date) : undefined}
                  onmouseleave={showTooltip ? () => (hovered = null) : undefined}
                >{#if showTooltip && hovered === day.date}<div class="ui-heatmap-calendar__tooltip">{day.date}: {v}</div>{/if}</div>
              {/if}
            {/each}
          </div>
        {/each}
      </div>
    </div>
  </div>
</ErrorBoundary>
