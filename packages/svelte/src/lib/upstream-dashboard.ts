/* UpstreamDashboard's pure helpers, copied from src/domain/upstream-dashboard.tsx
 * (drift-tested in tests/components/upstream-dashboard.test.ts). The two
 * formatters are public, as React's file exports them. */

export interface UpstreamLink {
  id: string
  vendor: string
  location: string
  inbound: number       // bytes per second
  outbound: number      // bytes per second
  capacity?: number     // max capacity in bytes per second
  burstCapacity?: number // burstable capacity in bytes per second
  status: 'ok' | 'warning' | 'critical' | 'unknown'
  trend?: number[]      // historical data points
}

export function formatBitRateSplit(bytesPerSecond: number): { value: string; unit: string } {
  const bps = bytesPerSecond * 8
  if (bps >= 1e12) return { value: (bps / 1e12).toFixed(2), unit: 'Tbps' }
  if (bps >= 1e9) return { value: (bps / 1e9).toFixed(2), unit: 'Gbps' }
  if (bps >= 1e6) return { value: (bps / 1e6).toFixed(2), unit: 'Mbps' }
  if (bps >= 1e3) return { value: (bps / 1e3).toFixed(2), unit: 'Kbps' }
  return { value: bps.toFixed(0), unit: 'bps' }
}

export function formatRelativeTime(timestamp: number): string {
  const diff = Math.max(0, Math.floor((Date.now() - timestamp) / 1000))
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export function computeUtilization(links: UpstreamLink[]): number | null {
  const totalTraffic = links.reduce((s, l) => s + l.inbound + l.outbound, 0)
  const totalCapacity = links.reduce((s, l) => s + (l.capacity ?? 0), 0)
  if (totalCapacity <= 0) return null
  return Math.min(100, Math.round((totalTraffic / totalCapacity) * 100))
}

export function formatTraffic(bytesPerSecond: number): string {
  const fmt = formatBitRateSplit(bytesPerSecond)
  return `${fmt.value} ${fmt.unit}`
}

export function utilColor(pct: number): string {
  if (pct > 80) return 'oklch(62% 0.22 25)'
  if (pct > 60) return 'oklch(80% 0.18 85)'
  return 'oklch(72% 0.19 155)'
}
