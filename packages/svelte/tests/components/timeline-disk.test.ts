import { describe, it, expect } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import SeverityTimeline from '../../src/components/SeverityTimeline.svelte'
import DiskMountBar from '../../src/components/DiskMountBar.svelte'

describe('SeverityTimeline', () => {
  it('expands and collapses each event independently', async () => {
    const events = [
      { id: 'a', timestamp: 0, severity: 'info' as const, title: 'A', description: 'da' },
      { id: 'b', timestamp: 0, severity: 'ok' as const, title: 'B', description: 'db' },
    ]
    const { container } = render(SeverityTimeline, { props: { events, expandable: true } })
    const [a, b] = container.querySelectorAll('button')
    await fireEvent.click(a); flushSync()
    const desc = () => [...container.querySelectorAll('.ui-severity-timeline__description')].map(d => d.getAttribute('data-expanded'))
    expect(desc()).toEqual(['true', 'false'])
    expect(a.textContent).toBe('Hide details')
    await fireEvent.click(b); await fireEvent.click(a); flushSync()
    expect(desc()).toEqual(['false', 'true'])
  })
})

describe('DiskMountBar', () => {
  const mk = (mount: string, utilPct: number) => ({ mount, utilPct, totalBytes: 100, usedBytes: utilPct, freeBytes: 100 - utilPct })

  it('shows the fullest first and expands to reveal the rest', async () => {
    const { container } = render(DiskMountBar, { props: { maxVisible: 1, mounts: [mk('/a', 10), mk('/b', 95), mk('/c', 50)] } })
    const names = () => [...container.querySelectorAll('.ui-disk-mount-bar__mount')].map(e => e.textContent)
    expect(names()).toEqual(['/b'])
    await fireEvent.click(screen.getByText('Show 2 more mounts')); flushSync()
    expect(names()).toEqual(['/b', '/c', '/a'])
    await fireEvent.click(screen.getByText('Show less')); flushSync()
    expect(names()).toEqual(['/b'])
  })
})
