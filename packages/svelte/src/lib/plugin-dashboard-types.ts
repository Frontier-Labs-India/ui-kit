/* PluginDashboard's config shape — React's, except a custom widget's `render`,
 * which returns a ReactNode there and is a snippet receiving the data here. */
import type { Snippet } from 'svelte'

export interface PluginMetricDef {
  key: string
  label: string
  format?: 'number' | 'bytes' | 'percent' | 'duration' | 'rate'
  unit?: string
  thresholds?: { warning: number; critical: number }
  sparkline?: boolean
}

export interface PluginChartDef {
  id: string
  title: string
  series: Array<{ key: string; label: string; color?: string }>
  height?: number
  yFormat?: 'number' | 'bytes' | 'percent' | 'duration'
}

export interface PluginPropertyDef {
  key: string
  label: string
  format?: 'text' | 'code' | 'link' | 'badge' | 'timestamp' | 'duration'
  copyable?: boolean
}

export interface DashboardWidget {
  id: string
  type: 'metric' | 'chart' | 'table' | 'status' | 'list' | 'gauge' | 'custom'
  title: string
  span?: 1 | 2 | 3
  height?: number | string
  metricKey?: string
  metricFormat?: 'number' | 'bytes' | 'percent' | 'duration' | 'rate'
  metricUnit?: string
  metricThresholds?: { warning: number; critical: number }
  metricSparkline?: boolean
  metricTrend?: boolean
  chartSeries?: Array<{ key: string; label: string; color?: string }>
  chartHeight?: number
  chartType?: 'line' | 'area' | 'bar'
  gaugeKey?: string
  gaugeMax?: number
  gaugeThresholds?: { warning: number; critical: number }
  tableColumns?: Array<{ key: string; label: string; format?: string }>
  tableDataKey?: string
  statusKey?: string
  statusLabels?: Record<string, string>
  listKey?: string
  listItemFormat?: 'text' | 'badge' | 'link'
  /** For 'custom' widgets: rendered with the dashboard data. */
  render?: Snippet<[Record<string, unknown>]>
}

export interface PluginDashboardConfig {
  name: string
  icon?: string | Snippet
  metrics: PluginMetricDef[]
  charts: PluginChartDef[]
  properties: PluginPropertyDef[]
  statusKey?: string
  widgets?: DashboardWidget[]
  layout?: 'auto' | '2-col' | '3-col'
}
