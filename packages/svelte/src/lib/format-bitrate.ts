/* Bytes per second to a bit-rate label — the helper the React package exports
 * beside NetworkTrafficCard. */
export function formatBitRate(bytesPerSecond: number): string {
  const bps = bytesPerSecond * 8
  if (bps >= 1e12) return `${(bps / 1e12).toFixed(2)} Tbps`
  if (bps >= 1e9) return `${(bps / 1e9).toFixed(2)} Gbps`
  if (bps >= 1e6) return `${(bps / 1e6).toFixed(2)} Mbps`
  if (bps >= 1e3) return `${(bps / 1e3).toFixed(2)} Kbps`
  return `${bps.toFixed(0)} bps`
}
