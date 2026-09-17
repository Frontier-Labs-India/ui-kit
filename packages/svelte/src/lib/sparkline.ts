/* The sparkline geometry shared by MetricCard, NetworkTrafficCard and
 * Sparkline. React repeats the same function in all three files; here it is
 * written once. Returns null for fewer than two points, which React renders as
 * nothing. */
export function sparklinePaths(
  data: number[] | undefined, w = 100, h = 24, pad = 1,
): { line: string; area: string; points: { x: number; y: number }[] } | null {
  if (!data || data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => ({ x: (i / (data.length - 1)) * w, y: h - pad - ((v - min) / range) * (h - pad * 2) }))
  let line = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 1; i < pts.length; i++) line += ` Q ${(pts[i - 1].x + pts[i].x) / 2} ${pts[i - 1].y}, ${pts[i].x} ${pts[i].y}`
  return { line, area: `${line} L ${pts[pts.length - 1].x} ${h} L ${pts[0].x} ${h} Z`, points: pts }
}
