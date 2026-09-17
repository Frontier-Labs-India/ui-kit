/* Line diff and folding for DiffViewer, copied from React's diff-viewer.tsx
 * without change: the backtrack order decides how a replaced line is shown,
 * and that is part of the contract. It walks back from the end preferring an
 * addition on ties and prepends, so in reading order a removed line comes
 * BEFORE the line that replaced it — as a unified diff reads. */

export type DiffLineType = 'added' | 'removed' | 'unchanged'
export interface DiffLine {
  type: DiffLineType
  value: string
  oldLineNum?: number
  newLineNum?: number
}
export type FoldedItem = { kind: 'lines'; lines: DiffLine[] } | { kind: 'fold'; lines: DiffLine[]; id: number }

export function computeDiff(oldStr: string, newStr: string): DiffLine[] {
  const a = oldStr.split('\n')
  const b = newStr.split('\n')
  const m = a.length, n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1])
    }
  }
  const out: DiffLine[] = []
  let i = m, j = n
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      out.unshift({ type: 'unchanged', value: a[i - 1], oldLineNum: i, newLineNum: j }); i--; j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      out.unshift({ type: 'added', value: b[j - 1], newLineNum: j }); j--
    } else if (i > 0) {
      out.unshift({ type: 'removed', value: a[i - 1], oldLineNum: i }); i--
    }
  }
  return out
}

/** Runs of unchanged lines longer than `threshold` keep their first and last
 *  line and fold the middle; changed lines group together. */
export function foldDiffLines(lines: DiffLine[], threshold: number): FoldedItem[] {
  const items: FoldedItem[] = []
  let run: DiffLine[] = []
  let foldId = 0
  const flush = () => {
    if (run.length === 0) return
    if (run.length > threshold && run.length > 2) {
      items.push({ kind: 'lines', lines: [run[0]] })
      items.push({ kind: 'fold', lines: run.slice(1, -1), id: foldId++ })
      items.push({ kind: 'lines', lines: [run[run.length - 1]] })
    } else {
      items.push({ kind: 'lines', lines: run })
    }
    run = []
  }
  for (const line of lines) {
    if (line.type === 'unchanged') { run.push(line); continue }
    flush()
    const last = items[items.length - 1]
    if (last?.kind === 'lines' && last.lines[last.lines.length - 1]?.type !== 'unchanged') last.lines.push(line)
    else items.push({ kind: 'lines', lines: [line] })
  }
  flush()
  return items
}
