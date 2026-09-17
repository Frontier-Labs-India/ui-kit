import { describe, it, expect } from 'vitest'
import { render, fireEvent } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import DiffViewer from '../../src/components/DiffViewer.svelte'
import { computeDiff, foldDiffLines } from '../../src/lib/diff.js'

describe('diff algorithm', () => {
  it('marks lines with their numbers; a replaced line reads removed, then added', () => {
    expect(computeDiff('a\nb\nc', 'a\nx\nc')).toEqual([
      { type: 'unchanged', value: 'a', oldLineNum: 1, newLineNum: 1 },
      { type: 'removed', value: 'b', oldLineNum: 2 },
      { type: 'added', value: 'x', newLineNum: 2 },
      { type: 'unchanged', value: 'c', oldLineNum: 3, newLineNum: 3 },
    ])
  })

  it('folds a long unchanged run to first line, fold, last line', () => {
    const lines = computeDiff('1\n2\n3\n4\n5\n6', '1\n2\n3\n4\n5\n6x')
    const kinds = foldDiffLines(lines, 3).map(i => (i.kind === 'fold' ? `fold(${i.lines.length})` : `lines(${i.lines.length})`))
    expect(kinds).toEqual(['lines(1)', 'fold(3)', 'lines(1)', 'lines(2)'])
  })
})

describe('DiffViewer', () => {
  it('preserves indentation exactly — text whitespace is content here', () => {
    const { container } = render(DiffViewer, { props: { oldValue: '  a\n\tb', newValue: '  a\n\tb\n    c', foldUnchanged: false } })
    const content = [...container.querySelectorAll('.ui-diff-viewer__content')].map(e => e.textContent)
    expect(content).toEqual(['  a', '\tb', '    c'])
  })

  it('expands a fold by click and by Enter', async () => {
    const old = Array.from({ length: 8 }, (_, i) => `l${i}`).join('\n')
    const { container } = render(DiffViewer, { props: { oldValue: old, newValue: old + '\nnew' } })
    const fold = container.querySelector('.ui-diff-viewer__fold')!
    expect(fold.textContent).toBe('6 unchanged lines')
    await fireEvent.keyDown(fold, { key: 'Enter' }); flushSync()
    expect(container.querySelector('.ui-diff-viewer__fold')).toBeNull()
    expect(container.querySelectorAll('.ui-diff-viewer__line--unchanged')).toHaveLength(8)
  })
})
