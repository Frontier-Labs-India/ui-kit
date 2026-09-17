<script module lang="ts">
  export interface TimeSeriesData {
    timestamp: number
    value: number
  }
  export interface TimeSeriesSeries {
    id: string
    label: string
    data: TimeSeriesData[]
    color?: string
  }
  export interface ChartAnnotation {
    type: 'horizontal' | 'vertical'
    /** A y-value for horizontal lines, a timestamp for vertical ones. */
    value: number
    label?: string
    /** Default oklch(70% 0 0). */
    color?: string
    /** Default true. */
    dashed?: boolean
  }
</script>

<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { SvelteSet } from 'svelte/reactivity'
  import { cn } from '../lib/cls.js'
  import ErrorBoundary from '../lib/ErrorBoundary.svelte'
  import { cssProps } from '../actions/css-props.js'
  import { portal } from '../actions/portal.js'
  import { mergeStyles, reactStyle, type StyleInput } from '../lib/react-style.js'
  import { getMotionLevel } from '../runes/motion-level.svelte.js'
  import type { MotionLevel } from '../runes/context.js'

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'style'> {
    series: TimeSeriesSeries[]
    height?: number
    showXAxis?: boolean
    showYAxis?: boolean
    showGrid?: boolean
    showTooltip?: boolean
    showLegend?: boolean
    yMin?: number
    yMax?: number
    formatValue?: (v: number) => string
    formatTime?: (t: number) => string
    motion?: MotionLevel
    brushable?: boolean
    onBrush?: (range: [number, number]) => void
    zoomable?: boolean
    onZoom?: (domain: { x: [number, number]; y: [number, number] }) => void
    toggleableSeries?: boolean
    annotations?: ChartAnnotation[]
    class?: string
    style?: StyleInput
  }

  const DEFAULT_COLORS = ['oklch(65% 0.2 270)', 'oklch(72% 0.19 155)', 'oklch(70% 0.2 30)', 'oklch(75% 0.15 200)', 'oklch(80% 0.18 85)', 'oklch(65% 0.2 320)']
  const PAD = { top: 12, right: 16, bottom: 28, left: 52 }
  function defaultFormatValue(v: number) {
    if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(1)}M`
    if (Math.abs(v) >= 1e3) return `${(v / 1e3).toFixed(1)}K`
    return v % 1 === 0 ? String(v) : v.toFixed(1)
  }
  function defaultFormatTime(t: number) {
    const d = new Date(t)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  let {
    series, height = 200, showXAxis = true, showYAxis = true, showGrid = true, showTooltip = true, showLegend = true,
    yMin: yMinProp, yMax: yMaxProp, formatValue = defaultFormatValue, formatTime = defaultFormatTime, motion,
    brushable = false, onBrush, zoomable = false, onZoom, toggleableSeries = false, annotations, class: className, style, ...rest
  }: Props = $props()

  const motionLevel = getMotionLevel(() => motion)
  let container = $state<HTMLDivElement | null>(null)
  let svg = $state<SVGSVGElement | null>(null)
  let tooltip = $state<HTMLDivElement | null>(null)
  let width = $state(400)
  let hoveredIdx = $state<number | null>(null)
  let brushStart = $state<number | null>(null)
  let brushEnd = $state<number | null>(null)
  let brushing = false
  let zoomX = $state<[number, number] | null>(null)
  let zoomY = $state<[number, number] | null>(null)
  const hidden = new SvelteSet<string>()

  $effect(() => {
    if (!container) return
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) if (entry.contentRect.width > 0) width = entry.contentRect.width
    })
    ro.observe(container)
    return () => ro.disconnect()
  })

  const allTimestamps = $derived.by(() => {
    const set = new Set<number>()
    for (const s of series) for (const d of s.data) set.add(d.timestamp)
    return [...set].sort((a, b) => a - b)
  })

  const yDomain = $derived.by(() => {
    let lo = yMinProp ?? Infinity
    let hi = yMaxProp ?? -Infinity
    for (const s of series) {
      for (const d of s.data) {
        if (yMinProp === undefined && d.value < lo) lo = d.value
        if (yMaxProp === undefined && d.value > hi) hi = d.value
      }
    }
    if (!isFinite(lo)) lo = 0
    if (!isFinite(hi)) hi = 100
    if (lo === hi) { lo -= 1; hi += 1 }
    const padding = (hi - lo) * 0.05
    return [yMinProp ?? lo - padding, yMaxProp ?? hi + padding] as [number, number]
  })

  const plotW = $derived(width - PAD.left - PAD.right)
  const plotH = $derived(height - PAD.top - PAD.bottom)
  const xMin = $derived(zoomX ? zoomX[0] : allTimestamps.length > 0 ? allTimestamps[0] : 0)
  const xMax = $derived(zoomX ? zoomX[1] : allTimestamps.length > 0 ? allTimestamps[allTimestamps.length - 1] : 1)
  const yLo = $derived(zoomY ? zoomY[0] : yDomain[0])
  const yHi = $derived(zoomY ? zoomY[1] : yDomain[1])

  const xScale = (t: number) => {
    if (allTimestamps.length < 2 && !zoomX) return PAD.left + plotW / 2
    return PAD.left + ((t - xMin) / (xMax - xMin || 1)) * plotW
  }
  const yScale = (v: number) => PAD.top + plotH - ((v - yLo) / (yHi - yLo || 1)) * plotH
  const xInverse = (px: number) => xMin + ((px - PAD.left) / plotW) * (xMax - xMin || 1)

  const yTicks = $derived.by(() => {
    const count = Math.max(2, Math.min(6, Math.floor(plotH / 36)))
    const step = (yHi - yLo) / count
    return Array.from({ length: count + 1 }, (_, i) => yLo + step * i)
  })
  const xTicks = $derived.by(() => {
    if (allTimestamps.length <= 1) return allTimestamps
    const step = Math.max(1, Math.floor(allTimestamps.length / Math.max(2, Math.floor(plotW / 60))))
    const ticks: number[] = []
    for (let i = 0; i < allTimestamps.length; i += step) ticks.push(allTimestamps[i])
    if (ticks[ticks.length - 1] !== allTimestamps[allTimestamps.length - 1]) ticks.push(allTimestamps[allTimestamps.length - 1])
    return ticks
  })

  function pathOf(data: TimeSeriesData[]) {
    if (data.length < 2) return ''
    const sorted = [...data].sort((a, b) => a.timestamp - b.timestamp)
    let d = `M ${xScale(sorted[0].timestamp)} ${yScale(sorted[0].value)}`
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1]
      const curr = sorted[i]
      d += ` Q ${(xScale(prev.timestamp) + xScale(curr.timestamp)) / 2} ${yScale(prev.value)}, ${xScale(curr.timestamp)} ${yScale(curr.value)}`
    }
    return d
  }

  const seriesData = $derived(series.map((s, i) => ({
    ...s,
    color: s.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
    path: pathOf(s.data),
    hidden: hidden.has(s.id),
  })))

  function handleMouseMove(e: MouseEvent) {
    if (!showTooltip || allTimestamps.length === 0 || !svg) return
    const rect = svg.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    let closest = 0
    let minDist = Infinity
    for (let i = 0; i < allTimestamps.length; i++) {
      const dist = Math.abs(xScale(allTimestamps[i]) - mouseX)
      if (dist < minDist) { minDist = dist; closest = i }
    }
    hoveredIdx = closest
    // Place the portalled tooltip near the cursor, kept inside the chart.
    if (tooltip) {
      const tw = tooltip.offsetWidth
      const th = tooltip.offsetHeight
      let x = e.clientX - tw / 2
      let y = e.clientY - th - 12
      if (x + tw > rect.right - 4) x = rect.right - tw - 4
      if (x < rect.left + 4) x = rect.left + 4
      if (y < rect.top + 4) y = e.clientY + 16
      if (y + th > rect.bottom - 4) y = rect.bottom - th - 4
      tooltip.style.left = `${x}px`
      tooltip.style.top = `${y}px`
    }
  }

  function brushMove(e: MouseEvent) {
    if (!brushing || !brushable || !svg) return
    const rect = svg.getBoundingClientRect()
    brushEnd = Math.max(PAD.left, Math.min(e.clientX - rect.left, PAD.left + plotW))
  }

  function brushUp() {
    if (!brushing || !brushable) return
    brushing = false
    if (brushStart !== null && brushEnd !== null) {
      const left = Math.min(brushStart, brushEnd)
      const right = Math.max(brushStart, brushEnd)
      if (right - left > 4) onBrush?.([xInverse(left), xInverse(right)])
    }
    brushStart = null
    brushEnd = null
  }

  $effect(() => {
    if (!brushable) return
    const up = () => {
      if (brushing) {
        brushing = false
        brushStart = null
        brushEnd = null
      }
    }
    window.addEventListener('mouseup', up)
    return () => window.removeEventListener('mouseup', up)
  })

  const dataBounds = () => [allTimestamps.length > 0 ? allTimestamps[0] : 0, allTimestamps.length > 0 ? allTimestamps[allTimestamps.length - 1] : 1] as [number, number]

  function handleWheel(e: WheelEvent) {
    if (!zoomable || !svg) return
    e.preventDefault()
    const rect = svg.getBoundingClientRect()
    const fraction = (e.clientX - rect.left - PAD.left) / plotW
    const [dataXMin, dataXMax] = dataBounds()
    const xRange = xMax - xMin
    const newXRange = xRange * (e.deltaY > 0 ? 1.15 : 1 / 1.15)
    const pivot = xMin + fraction * xRange
    let newXMin = pivot - fraction * newXRange
    let newXMax = pivot + (1 - fraction) * newXRange
    if (newXMin < dataXMin) newXMin = dataXMin
    if (newXMax > dataXMax) newXMax = dataXMax
    if (newXRange >= (dataXMax - dataXMin) * 1.01) {
      zoomX = null
      zoomY = null
      onZoom?.({ x: [dataXMin, dataXMax], y: yDomain })
      return
    }
    const y: [number, number] = [yLo, yHi]
    zoomX = [newXMin, newXMax]
    onZoom?.({ x: [newXMin, newXMax], y })
  }

  function resetZoom() {
    zoomX = null
    zoomY = null
    onZoom?.({ x: dataBounds(), y: yDomain })
  }

  const hoveredTimestamp = $derived(hoveredIdx !== null ? allTimestamps[hoveredIdx] : null)
  const TOOLTIP_STYLE = reactStyle({
    position: 'fixed', left: -9999, top: -9999, padding: '0.375rem 0.5rem', background: 'oklch(22% 0.02 270)',
    border: '1px solid oklch(100% 0 0 / 0.1)', borderRadius: '0.375rem', fontSize: '0.75rem', color: 'oklch(90% 0 0)',
    pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 1000, lineHeight: 1.4, boxShadow: '0 4px 12px oklch(0% 0 0 / 0.3)',
  })
</script>

<ErrorBoundary>
  <div bind:this={container} class={cn('ui-time-series-chart', className)} data-motion={motionLevel()} use:cssProps={mergeStyles(style)} {...rest}>
    {#if zoomable && (zoomX !== null || zoomY !== null)}
      <button class="ui-time-series-chart__zoom-reset" onclick={resetZoom} type="button">Reset zoom</button>
    {/if}
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <svg bind:this={svg} {width} {height} viewBox={`0 0 ${width} ${height}`} aria-label="Time series chart" role="img" onwheel={zoomable ? handleWheel : undefined}>
      {#if showGrid}{#each yTicks as v}<line class="ui-time-series-chart__grid-line" x1={PAD.left} y1={yScale(v)} x2={width - PAD.right} y2={yScale(v)} />{/each}{/if}
      {#if showYAxis}{#each yTicks as v}<text class="ui-time-series-chart__axis-label" x={PAD.left - 6} y={yScale(v)} text-anchor="end" dominant-baseline="central">{formatValue(v)}</text>{/each}{/if}
      {#if showXAxis}{#each xTicks as t}<text class="ui-time-series-chart__axis-label" x={xScale(t)} y={height - 4} text-anchor="middle">{formatTime(t)}</text>{/each}{/if}
      {#each seriesData as s}{#if s.path && !s.hidden}<path class="ui-time-series-chart__series-line" d={s.path} stroke={s.color} use:cssProps={{ '--line-len': '2000' }} />{/if}{/each}
      {#each annotations ?? [] as ann}
        {@const color = ann.color || 'oklch(70% 0 0)'}
        {@const dash = ann.dashed !== false ? '6 4' : undefined}
        {#if ann.type === 'horizontal'}
          {@const y = yScale(ann.value)}
          <g class="ui-time-series-chart__annotation">
            <line x1={PAD.left} y1={y} x2={width - PAD.right} y2={y} stroke={color} stroke-width={1.5} stroke-dasharray={dash} />
            {#if ann.label}<text class="ui-time-series-chart__annotation-label" x={width - PAD.right - 4} y={y - 4} text-anchor="end" fill={color}>{ann.label}</text>{/if}
          </g>
        {:else}
          {@const x = xScale(ann.value)}
          <g class="ui-time-series-chart__annotation">
            <line x1={x} y1={PAD.top} x2={x} y2={height - PAD.bottom} stroke={color} stroke-width={1.5} stroke-dasharray={dash} />
            {#if ann.label}<text class="ui-time-series-chart__annotation-label" x={x + 4} y={PAD.top + 10} text-anchor="start" fill={color}>{ann.label}</text>{/if}
          </g>
        {/if}
      {/each}
      {#if hoveredTimestamp !== null}
        <line class="ui-time-series-chart__crosshair" x1={xScale(hoveredTimestamp)} y1={PAD.top} x2={xScale(hoveredTimestamp)} y2={height - PAD.bottom} />
        {#each seriesData as s}
          {@const pt = s.hidden ? undefined : s.data.find(d => d.timestamp === hoveredTimestamp)}
          {#if pt}<circle class="ui-time-series-chart__dot" cx={xScale(pt.timestamp)} cy={yScale(pt.value)} r={3.5} fill={s.color} stroke="var(--bg-base, oklch(18% 0.02 270))" stroke-width={1.5} />{/if}
        {/each}
      {/if}
      {#if brushable && brushStart !== null && brushEnd !== null}
        <rect class="ui-time-series-chart__brush" x={Math.min(brushStart, brushEnd)} y={PAD.top} width={Math.abs(brushEnd - brushStart)} height={plotH} />
        <rect class="ui-time-series-chart__brush-handle" x={Math.min(brushStart, brushEnd) - 2} y={PAD.top} width={4} height={plotH} rx={2} />
        <rect class="ui-time-series-chart__brush-handle" x={Math.max(brushStart, brushEnd) - 2} y={PAD.top} width={4} height={plotH} rx={2} />
      {/if}
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <rect
        class="ui-time-series-chart__hit-area"
        x={PAD.left}
        y={PAD.top}
        width={plotW}
        height={plotH}
        onmousemove={e => { handleMouseMove(e); brushMove(e) }}
        onmousedown={brushable ? (e => { if (!svg) return; const x = e.clientX - svg.getBoundingClientRect().left; brushStart = x; brushEnd = x; brushing = true }) : undefined}
        onmouseup={brushable ? brushUp : undefined}
        onmouseleave={() => { hoveredIdx = null; if (brushing) brushUp() }}
      />
    </svg>
    {#if showTooltip && hoveredTimestamp !== null}
      <!-- Portalled to <body> so an ancestor transform cannot break position: fixed, as in React. -->
      <div use:portal bind:this={tooltip} class="ui-time-series-chart__tooltip-box" use:cssProps={TOOLTIP_STYLE}>
        <div class="ui-time-series-chart__tooltip-time">{formatTime(hoveredTimestamp)}</div>
        {#each seriesData as s}
          {@const pt = s.data.find(d => d.timestamp === hoveredTimestamp)}
          {#if pt}<div class="ui-time-series-chart__tooltip-row"><span class="ui-time-series-chart__tooltip-swatch" use:cssProps={{ background: s.color }}></span><span>{s.label}: {formatValue(pt.value)}</span></div>{/if}
        {/each}
      </div>
    {/if}
    {#if showLegend && series.length > 1}
      <div class="ui-time-series-chart__legend">
        {#each seriesData as s}
          <div class="ui-time-series-chart__legend-item" use:cssProps={s.hidden ? { opacity: '0.4' } : {}}>
            {#if toggleableSeries}
              <input type="checkbox" class="ui-time-series-chart__legend-checkbox" checked={!s.hidden} onchange={() => (hidden.has(s.id) ? hidden.delete(s.id) : hidden.add(s.id))} aria-label={`Toggle ${s.label}`} use:cssProps={{ '--cb-color': s.color, background: s.hidden ? 'transparent' : null }} />
            {/if}
            <span class="ui-time-series-chart__legend-swatch" use:cssProps={{ background: s.color }}></span>
            <span>{s.label}</span>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</ErrorBoundary>
