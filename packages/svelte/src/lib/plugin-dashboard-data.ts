/* PluginDashboard's formatters and built-in configs, extracted VERBATIM from
 * React's src/domain/plugin-dashboard.tsx by script, with a drift test in
 * plugin-dashboard.test.ts. Edit the React source and re-extract; do not edit
 * here. The config types live in plugin-dashboard-types.ts (a custom widget's
 * `render` is a snippet in Svelte). */
import type { PluginDashboardConfig } from './plugin-dashboard-types.js'

export function formatMetricValue(value: unknown, format?: string, unit?: string): string {
  if (value == null) return '—'
  const num = Number(value)
  if (Number.isNaN(num)) return String(value)

  switch (format) {
    case 'bytes': {
      const units = ['B', 'KB', 'MB', 'GB', 'TB']
      let v = num
      let i = 0
      while (v >= 1024 && i < units.length - 1) { v /= 1024; i++ }
      return `${i === 0 ? v : v.toFixed(1)} ${units[i]}`
    }
    case 'percent':
      return `${num % 1 === 0 ? num : num.toFixed(1)}%`
    case 'duration': {
      if (num < 1000) return `${Math.round(num)}ms`
      if (num < 60_000) return `${(num / 1000).toFixed(1)}s`
      const mins = Math.floor(num / 60_000)
      const secs = Math.round((num % 60_000) / 1000)
      if (num < 3_600_000) return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`
      const hrs = Math.floor(num / 3_600_000)
      const rmins = Math.floor((num % 3_600_000) / 60_000)
      if (num < 86_400_000) return rmins > 0 ? `${hrs}h ${rmins}m` : `${hrs}h`
      const days = Math.floor(num / 86_400_000)
      const rhrs = Math.floor((num % 86_400_000) / 3_600_000)
      return rhrs > 0 ? `${days}d ${rhrs}h` : `${days}d`
    }
    case 'rate': {
      if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M/s`
      if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K/s`
      return `${num.toFixed(0)}/s`
    }
    case 'number':
    default:
      return unit ? `${num.toLocaleString()} ${unit}` : num.toLocaleString()
  }
}

export function deriveStatus(
  value: unknown,
  thresholds?: { warning: number; critical: number },
): 'ok' | 'warning' | 'critical' | undefined {
  if (!thresholds || value == null) return undefined
  const num = Number(value)
  if (Number.isNaN(num)) return undefined
  // For metrics where lower is worse (like cache_hit_ratio), critical < warning
  if (thresholds.critical < thresholds.warning) {
    if (num <= thresholds.critical) return 'critical'
    if (num <= thresholds.warning) return 'warning'
    return 'ok'
  }
  // Normal: higher is worse
  if (num >= thresholds.critical) return 'critical'
  if (num >= thresholds.warning) return 'warning'
  return 'ok'
}

export const POSTGRES_DASHBOARD: PluginDashboardConfig = {
  name: 'PostgreSQL',
  metrics: [
    { key: 'connections', label: 'Active Connections', format: 'number', thresholds: { warning: 80, critical: 95 } },
    { key: 'qps', label: 'Queries/sec', format: 'rate' },
    { key: 'cache_hit_ratio', label: 'Cache Hit Ratio', format: 'percent', thresholds: { warning: 90, critical: 80 } },
    { key: 'replication_lag', label: 'Replication Lag', format: 'duration', thresholds: { warning: 1000, critical: 5000 } },
  ],
  charts: [
    { id: 'qps', title: 'Queries Per Second', series: [{ key: 'qps', label: 'QPS' }] },
    { id: 'connections', title: 'Connections', series: [{ key: 'connections', label: 'Active' }, { key: 'max_connections', label: 'Max', color: 'oklch(62% 0.22 25)' }] },
  ],
  properties: [
    { key: 'version', label: 'Version', format: 'text' },
    { key: 'host', label: 'Host', format: 'code', copyable: true },
    { key: 'port', label: 'Port', format: 'text' },
    { key: 'database', label: 'Database', format: 'text' },
    { key: 'uptime', label: 'Uptime', format: 'duration' },
  ],
  statusKey: 'connections',
  widgets: [
    { id: 'w-conn', type: 'metric', title: 'Active Connections', metricKey: 'connections', metricFormat: 'number', metricThresholds: { warning: 80, critical: 95 }, metricTrend: true },
    { id: 'w-qps', type: 'metric', title: 'Queries/sec', metricKey: 'qps', metricFormat: 'rate', metricSparkline: true },
    { id: 'w-cache', type: 'metric', title: 'Cache Hit Ratio', metricKey: 'cache_hit_ratio', metricFormat: 'percent', metricThresholds: { warning: 90, critical: 80 } },
    { id: 'w-lag', type: 'metric', title: 'Replication Lag', metricKey: 'replication_lag', metricFormat: 'duration', metricThresholds: { warning: 1000, critical: 5000 } },
    { id: 'w-qps-chart', type: 'chart', title: 'QPS Over Time', span: 2, chartSeries: [{ key: 'qps', label: 'QPS' }], chartType: 'area', chartHeight: 140 },
    { id: 'w-pool-gauge', type: 'gauge', title: 'Connection Pool', gaugeKey: 'connections', gaugeMax: 100, gaugeThresholds: { warning: 80, critical: 95 } },
    { id: 'w-queries', type: 'table', title: 'Active Queries', span: 2, tableDataKey: 'active_queries', tableColumns: [{ key: 'pid', label: 'PID' }, { key: 'query', label: 'Query' }, { key: 'duration', label: 'Duration', format: 'duration' }, { key: 'state', label: 'State' }] },
    { id: 'w-repl-status', type: 'status', title: 'Replication', statusKey: 'replication_status', statusLabels: { streaming: 'Streaming', stopped: 'Stopped', catchup: 'Catching Up' } },
    { id: 'w-slow', type: 'list', title: 'Recent Slow Queries', span: 3, listKey: 'slow_queries_list', listItemFormat: 'text' },
  ],
  layout: 'auto',
}

export const MYSQL_DASHBOARD: PluginDashboardConfig = {
  name: 'MySQL',
  metrics: [
    { key: 'threads_connected', label: 'Threads Connected', format: 'number', thresholds: { warning: 100, critical: 150 } },
    { key: 'qps', label: 'Queries/sec', format: 'rate' },
    { key: 'innodb_buffer_hit_ratio', label: 'Buffer Pool Hit Ratio', format: 'percent', thresholds: { warning: 95, critical: 90 } },
    { key: 'slow_queries', label: 'Slow Queries', format: 'number', thresholds: { warning: 10, critical: 50 } },
  ],
  charts: [
    { id: 'qps', title: 'Queries Per Second', series: [{ key: 'qps', label: 'QPS' }] },
    { id: 'threads', title: 'Thread Activity', series: [{ key: 'threads_connected', label: 'Connected' }, { key: 'threads_running', label: 'Running', color: 'oklch(72% 0.19 155)' }] },
  ],
  properties: [
    { key: 'version', label: 'Version', format: 'text' },
    { key: 'host', label: 'Host', format: 'code', copyable: true },
    { key: 'port', label: 'Port', format: 'text' },
    { key: 'database', label: 'Database', format: 'text' },
    { key: 'uptime', label: 'Uptime', format: 'duration' },
  ],
  statusKey: 'threads_connected',
  widgets: [
    { id: 'w-threads', type: 'metric', title: 'Threads Connected', metricKey: 'threads_connected', metricFormat: 'number', metricThresholds: { warning: 100, critical: 150 } },
    { id: 'w-qps', type: 'metric', title: 'Queries/sec', metricKey: 'qps', metricFormat: 'rate', metricSparkline: true },
    { id: 'w-buffer', type: 'gauge', title: 'Buffer Pool Hit Ratio', gaugeKey: 'innodb_buffer_hit_ratio', gaugeMax: 100, gaugeThresholds: { warning: 95, critical: 90 } },
    { id: 'w-slow', type: 'metric', title: 'Slow Queries', metricKey: 'slow_queries', metricFormat: 'number', metricThresholds: { warning: 10, critical: 50 } },
    { id: 'w-qps-chart', type: 'chart', title: 'QPS Over Time', span: 2, chartSeries: [{ key: 'qps', label: 'QPS' }], chartType: 'line', chartHeight: 140 },
    { id: 'w-repl', type: 'status', title: 'Replication Status', statusKey: 'replication_status' },
  ],
}

export const REDIS_DASHBOARD: PluginDashboardConfig = {
  name: 'Redis',
  metrics: [
    { key: 'connected_clients', label: 'Connected Clients', format: 'number', thresholds: { warning: 500, critical: 1000 } },
    { key: 'ops_per_sec', label: 'Ops/sec', format: 'rate' },
    { key: 'used_memory', label: 'Used Memory', format: 'bytes', thresholds: { warning: 4_294_967_296, critical: 8_589_934_592 } },
    { key: 'hit_rate', label: 'Hit Rate', format: 'percent', thresholds: { warning: 90, critical: 80 } },
  ],
  charts: [
    { id: 'ops', title: 'Operations Per Second', series: [{ key: 'ops_per_sec', label: 'Ops/s' }] },
    { id: 'memory', title: 'Memory Usage', series: [{ key: 'used_memory', label: 'Used' }, { key: 'max_memory', label: 'Max', color: 'oklch(62% 0.22 25)' }] },
  ],
  properties: [
    { key: 'version', label: 'Version', format: 'text' },
    { key: 'host', label: 'Host', format: 'code', copyable: true },
    { key: 'port', label: 'Port', format: 'text' },
    { key: 'role', label: 'Role', format: 'badge' },
    { key: 'uptime', label: 'Uptime', format: 'duration' },
  ],
  statusKey: 'connected_clients',
  widgets: [
    { id: 'w-clients', type: 'metric', title: 'Connected Clients', metricKey: 'connected_clients', metricFormat: 'number', metricThresholds: { warning: 500, critical: 1000 } },
    { id: 'w-ops', type: 'metric', title: 'Ops/sec', metricKey: 'ops_per_sec', metricFormat: 'rate', metricSparkline: true },
    { id: 'w-mem', type: 'metric', title: 'Used Memory', metricKey: 'used_memory', metricFormat: 'bytes' },
    { id: 'w-hit', type: 'gauge', title: 'Hit Rate', gaugeKey: 'hit_rate', gaugeMax: 100, gaugeThresholds: { warning: 90, critical: 80 } },
    { id: 'w-mem-chart', type: 'chart', title: 'Memory Over Time', span: 2, chartSeries: [{ key: 'used_memory', label: 'Used' }, { key: 'max_memory', label: 'Max', color: 'oklch(62% 0.22 25)' }], chartType: 'area' },
    { id: 'w-keys', type: 'list', title: 'Hot Keys', listKey: 'hot_keys', listItemFormat: 'badge' },
  ],
}

export const KAFKA_DASHBOARD: PluginDashboardConfig = {
  name: 'Kafka',
  metrics: [
    { key: 'messages_per_sec', label: 'Messages/sec', format: 'rate' },
    { key: 'consumer_lag', label: 'Consumer Lag', format: 'number', thresholds: { warning: 10_000, critical: 100_000 } },
    { key: 'partitions', label: 'Partitions', format: 'number' },
    { key: 'under_replicated', label: 'Under-replicated', format: 'number', thresholds: { warning: 1, critical: 5 } },
  ],
  charts: [
    { id: 'throughput', title: 'Message Throughput', series: [{ key: 'messages_in', label: 'In' }, { key: 'messages_out', label: 'Out', color: 'oklch(72% 0.19 155)' }] },
    { id: 'lag', title: 'Consumer Lag', series: [{ key: 'consumer_lag', label: 'Lag' }] },
  ],
  properties: [
    { key: 'version', label: 'Version', format: 'text' },
    { key: 'broker_count', label: 'Brokers', format: 'text' },
    { key: 'cluster_id', label: 'Cluster ID', format: 'code', copyable: true },
    { key: 'topics', label: 'Topics', format: 'text' },
    { key: 'uptime', label: 'Uptime', format: 'duration' },
  ],
  statusKey: 'under_replicated',
  widgets: [
    { id: 'w-msgs', type: 'metric', title: 'Messages/sec', metricKey: 'messages_per_sec', metricFormat: 'rate', metricSparkline: true },
    { id: 'w-lag', type: 'metric', title: 'Consumer Lag', metricKey: 'consumer_lag', metricFormat: 'number', metricThresholds: { warning: 10_000, critical: 100_000 } },
    { id: 'w-parts', type: 'metric', title: 'Partitions', metricKey: 'partitions', metricFormat: 'number' },
    { id: 'w-underrepl', type: 'metric', title: 'Under-replicated', metricKey: 'under_replicated', metricFormat: 'number', metricThresholds: { warning: 1, critical: 5 } },
    { id: 'w-throughput', type: 'chart', title: 'Message Throughput', span: 3, chartSeries: [{ key: 'messages_in', label: 'In' }, { key: 'messages_out', label: 'Out', color: 'oklch(72% 0.19 155)' }], chartType: 'area', chartHeight: 160 },
    { id: 'w-groups', type: 'table', title: 'Consumer Groups', span: 2, tableDataKey: 'consumer_groups', tableColumns: [{ key: 'group', label: 'Group' }, { key: 'members', label: 'Members' }, { key: 'lag', label: 'Lag', format: 'number' }] },
    { id: 'w-broker-status', type: 'status', title: 'Cluster Health', statusKey: 'cluster_health' },
  ],
}

export const KUBERNETES_DASHBOARD: PluginDashboardConfig = {
  name: 'Kubernetes',
  metrics: [
    { key: 'pod_count', label: 'Running Pods', format: 'number' },
    { key: 'cpu_usage', label: 'CPU Usage', format: 'percent', thresholds: { warning: 75, critical: 90 } },
    { key: 'memory_usage', label: 'Memory Usage', format: 'percent', thresholds: { warning: 80, critical: 95 } },
    { key: 'restart_count', label: 'Pod Restarts (1h)', format: 'number', thresholds: { warning: 5, critical: 20 } },
  ],
  charts: [
    { id: 'cpu', title: 'CPU Utilization', series: [{ key: 'cpu_usage', label: 'Usage' }, { key: 'cpu_request', label: 'Request', color: 'oklch(80% 0.18 85)' }] },
    { id: 'memory', title: 'Memory Utilization', series: [{ key: 'memory_usage', label: 'Usage' }, { key: 'memory_limit', label: 'Limit', color: 'oklch(62% 0.22 25)' }] },
  ],
  properties: [
    { key: 'cluster', label: 'Cluster', format: 'text' },
    { key: 'namespace', label: 'Namespace', format: 'badge' },
    { key: 'node_count', label: 'Nodes', format: 'text' },
    { key: 'k8s_version', label: 'Version', format: 'text' },
    { key: 'context', label: 'Context', format: 'code', copyable: true },
  ],
  statusKey: 'cpu_usage',
  widgets: [
    { id: 'w-pods', type: 'metric', title: 'Running Pods', metricKey: 'pod_count', metricFormat: 'number', metricTrend: true },
    { id: 'w-cpu', type: 'gauge', title: 'CPU Usage', gaugeKey: 'cpu_usage', gaugeMax: 100, gaugeThresholds: { warning: 75, critical: 90 } },
    { id: 'w-mem', type: 'gauge', title: 'Memory Usage', gaugeKey: 'memory_usage', gaugeMax: 100, gaugeThresholds: { warning: 80, critical: 95 } },
    { id: 'w-restarts', type: 'metric', title: 'Pod Restarts (1h)', metricKey: 'restart_count', metricFormat: 'number', metricThresholds: { warning: 5, critical: 20 } },
    { id: 'w-events', type: 'list', title: 'Recent Events', span: 2, listKey: 'recent_events', listItemFormat: 'text' },
    { id: 'w-ns-status', type: 'status', title: 'Namespace Status', statusKey: 'namespace_status' },
  ],
}

export const DOCKER_DASHBOARD: PluginDashboardConfig = {
  name: 'Docker',
  metrics: [
    { key: 'running_containers', label: 'Running Containers', format: 'number' },
    { key: 'cpu_usage', label: 'CPU Usage', format: 'percent', thresholds: { warning: 70, critical: 90 } },
    { key: 'memory_usage', label: 'Memory Usage', format: 'bytes', thresholds: { warning: 4_294_967_296, critical: 8_589_934_592 } },
    { key: 'disk_usage', label: 'Disk Usage', format: 'bytes' },
  ],
  charts: [
    { id: 'cpu', title: 'CPU Usage', series: [{ key: 'cpu_usage', label: 'CPU %' }] },
    { id: 'memory', title: 'Memory Usage', series: [{ key: 'memory_usage', label: 'Used' }] },
  ],
  properties: [
    { key: 'version', label: 'Docker Version', format: 'text' },
    { key: 'host', label: 'Host', format: 'code', copyable: true },
    { key: 'images', label: 'Images', format: 'text' },
    { key: 'volumes', label: 'Volumes', format: 'text' },
    { key: 'networks', label: 'Networks', format: 'text' },
  ],
  statusKey: 'cpu_usage',
  widgets: [
    { id: 'w-containers', type: 'metric', title: 'Running Containers', metricKey: 'running_containers', metricFormat: 'number' },
    { id: 'w-cpu', type: 'gauge', title: 'CPU Usage', gaugeKey: 'cpu_usage', gaugeMax: 100, gaugeThresholds: { warning: 70, critical: 90 } },
    { id: 'w-mem', type: 'metric', title: 'Memory Usage', metricKey: 'memory_usage', metricFormat: 'bytes' },
    { id: 'w-disk', type: 'metric', title: 'Disk Usage', metricKey: 'disk_usage', metricFormat: 'bytes' },
    { id: 'w-container-list', type: 'table', title: 'Container List', span: 3, tableDataKey: 'containers', tableColumns: [{ key: 'name', label: 'Name' }, { key: 'image', label: 'Image' }, { key: 'status', label: 'Status' }, { key: 'cpu', label: 'CPU', format: 'percent' }] },
  ],
}

export const NGINX_DASHBOARD: PluginDashboardConfig = {
  name: 'NGINX',
  metrics: [
    { key: 'active_connections', label: 'Active Connections', format: 'number', thresholds: { warning: 5000, critical: 10_000 } },
    { key: 'requests_per_sec', label: 'Requests/sec', format: 'rate' },
    { key: 'error_rate', label: 'Error Rate', format: 'percent', thresholds: { warning: 1, critical: 5 } },
    { key: 'avg_response_time', label: 'Avg Response', format: 'duration', thresholds: { warning: 500, critical: 2000 } },
  ],
  charts: [
    { id: 'requests', title: 'Request Rate', series: [{ key: 'requests_per_sec', label: 'Req/s' }] },
    { id: 'response', title: 'Response Time', series: [{ key: 'avg_response_time', label: 'Avg' }, { key: 'p99_response_time', label: 'p99', color: 'oklch(62% 0.22 25)' }] },
  ],
  properties: [
    { key: 'version', label: 'Version', format: 'text' },
    { key: 'host', label: 'Host', format: 'code', copyable: true },
    { key: 'config_path', label: 'Config', format: 'code' },
    { key: 'worker_processes', label: 'Workers', format: 'text' },
    { key: 'uptime', label: 'Uptime', format: 'duration' },
  ],
  statusKey: 'active_connections',
  widgets: [
    { id: 'w-conns', type: 'metric', title: 'Active Connections', metricKey: 'active_connections', metricFormat: 'number', metricThresholds: { warning: 5000, critical: 10_000 }, metricTrend: true },
    { id: 'w-rps', type: 'metric', title: 'Requests/sec', metricKey: 'requests_per_sec', metricFormat: 'rate', metricSparkline: true },
    { id: 'w-err', type: 'metric', title: 'Error Rate', metricKey: 'error_rate', metricFormat: 'percent', metricThresholds: { warning: 1, critical: 5 } },
    { id: 'w-resp', type: 'metric', title: 'Avg Response', metricKey: 'avg_response_time', metricFormat: 'duration', metricThresholds: { warning: 500, critical: 2000 } },
    { id: 'w-status-codes', type: 'table', title: 'Status Code Breakdown', span: 2, tableDataKey: 'status_codes', tableColumns: [{ key: 'code', label: 'Code' }, { key: 'count', label: 'Count', format: 'number' }, { key: 'percent', label: '%', format: 'percent' }] },
    { id: 'w-health', type: 'status', title: 'Service Health', statusKey: 'health_status' },
  ],
}

export const ELASTICSEARCH_DASHBOARD: PluginDashboardConfig = {
  name: 'Elasticsearch',
  metrics: [
    { key: 'docs_count', label: 'Documents', format: 'number' },
    { key: 'search_rate', label: 'Search Rate', format: 'rate' },
    { key: 'index_rate', label: 'Index Rate', format: 'rate' },
    { key: 'store_size', label: 'Store Size', format: 'bytes' },
  ],
  charts: [
    { id: 'search', title: 'Search Rate', series: [{ key: 'search_rate', label: 'Searches/s' }] },
    { id: 'indexing', title: 'Indexing Rate', series: [{ key: 'index_rate', label: 'Docs/s' }] },
  ],
  properties: [
    { key: 'version', label: 'Version', format: 'text' },
    { key: 'cluster_name', label: 'Cluster', format: 'text' },
    { key: 'host', label: 'Host', format: 'code', copyable: true },
    { key: 'node_count', label: 'Nodes', format: 'text' },
    { key: 'status', label: 'Health', format: 'badge' },
    { key: 'uptime', label: 'Uptime', format: 'duration' },
  ],
  statusKey: 'docs_count',
  widgets: [
    { id: 'w-docs', type: 'metric', title: 'Documents', metricKey: 'docs_count', metricFormat: 'number', metricTrend: true },
    { id: 'w-search', type: 'metric', title: 'Search Rate', metricKey: 'search_rate', metricFormat: 'rate', metricSparkline: true },
    { id: 'w-index', type: 'metric', title: 'Index Rate', metricKey: 'index_rate', metricFormat: 'rate' },
    { id: 'w-store', type: 'metric', title: 'Store Size', metricKey: 'store_size', metricFormat: 'bytes' },
    { id: 'w-health', type: 'status', title: 'Cluster Health', statusKey: 'cluster_status', statusLabels: { green: 'Healthy', yellow: 'Degraded', red: 'Critical' } },
    { id: 'w-indices', type: 'table', title: 'Top Indices', span: 2, tableDataKey: 'top_indices', tableColumns: [{ key: 'name', label: 'Index' }, { key: 'docs', label: 'Docs', format: 'number' }, { key: 'size', label: 'Size', format: 'bytes' }] },
  ],
}
