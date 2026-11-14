import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent } from '@testing-library/svelte'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { UpstreamDashboard, formatBitRateSplit, formatRelativeTime } from '../../src/index.js'

const LINKS = [
  { id: 'a', vendor: 'Arista', location: 'DC1', inbound: 100, outbound: 0, capacity: 1000, status: 'ok' as const },
  { id: 'b', vendor: 'Juniper', location: 'DC2', inbound: 200, outbound: 0, capacity: 1000, status: 'warning' as const },
  { id: 'c', vendor: 'Arista', location: 'DC2', inbound: 300, outbound: 0, status: 'critical' as const },
]
const q = (c: HTMLElement, sel: string) => Array.from(c.querySelectorAll<HTMLElement>(sel))

afterEach(() => vi.useRealTimers())

describe('UpstreamDashboard', () => {
  it('hero: mini cards, the hero card and group headers report clicks and Enter/Space, with the default prevented', async () => {
    const onLinkClick = vi.fn(), onGroupClick = vi.fn(), onSummaryClick = vi.fn()
    const { container } = render(UpstreamDashboard, { props: { links: LINKS, mode: 'hero', groupBy: 'vendor', onLinkClick, onGroupClick, onSummaryClick } })
    const cards = q(container, '.ui-upstream-dashboard__mini-card')
    expect(cards.map(c => c.textContent?.includes('DC1') || c.textContent?.includes('DC2'))).toEqual([true, true, true])
    await fireEvent.click(cards[1])
    expect(onLinkClick).toHaveBeenLastCalledWith(LINKS[2])
    const space = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true })
    cards[0].dispatchEvent(space)
    expect(space.defaultPrevented).toBe(true)
    expect(onLinkClick).toHaveBeenLastCalledWith(LINKS[0])
    await fireEvent.keyDown(cards[2], { key: 'Enter' })
    expect(onLinkClick).toHaveBeenLastCalledWith(LINKS[1])
    await fireEvent.keyDown(cards[2], { key: 'a' })
    expect(onLinkClick).toHaveBeenCalledTimes(3)

    const headers = q(container, '.ui-upstream-dashboard__group-card-header')
    await fireEvent.click(headers[0])
    expect(onGroupClick).toHaveBeenLastCalledWith('Arista', [LINKS[0], LINKS[2]])
    await fireEvent.keyDown(headers[1], { key: 'Enter' })
    expect(onGroupClick).toHaveBeenLastCalledWith('Juniper', [LINKS[1]])

    const hero = container.querySelector<HTMLElement>('[data-testid="hero-card"]')!
    await fireEvent.click(hero)
    await fireEvent.keyDown(hero, { key: ' ' })
    expect(onSummaryClick).toHaveBeenCalledTimes(2)
  })

  it('nothing is clickable or focusable without the callbacks', async () => {
    const { container } = render(UpstreamDashboard, { props: { links: LINKS, mode: 'hero', groupBy: 'location', showSummary: true } })
    expect(container.querySelector('[data-clickable]')).toBeNull()
    expect(container.querySelector('[tabindex]')).toBeNull()
    // The summary keeps role=region; only the hero card would become a button.
    expect(container.querySelector('[role="button"]')).toBeNull()
  })

  it('summary card: click and keys call onSummaryClick', async () => {
    const onSummaryClick = vi.fn()
    const { container } = render(UpstreamDashboard, { props: { links: LINKS, showSummary: true, onSummaryClick } })
    const summary = container.querySelector<HTMLElement>('.ui-upstream-dashboard__summary')!
    expect(summary.getAttribute('role')).toBe('region')
    await fireEvent.click(summary)
    await fireEvent.keyDown(summary, { key: 'Enter' })
    await fireEvent.keyDown(summary, { key: 'Escape' })
    expect(onSummaryClick).toHaveBeenCalledTimes(2)
  })

  it('compact: cards and the summary strip report clicks and keys', async () => {
    const onLinkClick = vi.fn(), onSummaryClick = vi.fn()
    const { container } = render(UpstreamDashboard, { props: { links: LINKS, mode: 'compact', onLinkClick, onSummaryClick } })
    const cards = q(container, '.ui-upstream-dashboard__compact-card')
    await fireEvent.click(cards[2])
    await fireEvent.keyDown(cards[0], { key: ' ' })
    expect(onLinkClick.mock.calls).toEqual([[LINKS[2]], [LINKS[0]]])
    const strip = container.querySelector<HTMLElement>('.ui-upstream-dashboard__compact-summary')!
    await fireEvent.click(strip)
    await fireEvent.keyDown(strip, { key: 'Enter' })
    expect(onSummaryClick).toHaveBeenCalledTimes(2)
  })

  for (const variant of [{ mode: 'compact' as const }, { compact: false }]) {
    const label = variant.mode ? 'compact groups' : 'legacy groups'
    it(`${label}: a header click collapses and re-expands its own group and reports it every time`, async () => {
      const onGroupClick = vi.fn()
      const { container } = render(UpstreamDashboard, { props: { links: LINKS, groupBy: 'location', onGroupClick, ...variant } })
      const sections = q(container, 'section.ui-upstream-dashboard__group')
      const button = (i: number) => sections[i].querySelector<HTMLElement>('.ui-upstream-dashboard__group-header')!
      expect(sections).toHaveLength(2)
      expect(button(0).getAttribute('aria-expanded')).toBe('true')
      await fireEvent.click(button(0))
      expect(sections[0].hasAttribute('data-collapsed')).toBe(true)
      expect(button(0).getAttribute('aria-expanded')).toBe('false')
      expect(sections[1].hasAttribute('data-collapsed')).toBe(false)
      await fireEvent.click(button(0))
      expect(sections[0].hasAttribute('data-collapsed')).toBe(false)
      expect(onGroupClick.mock.calls).toEqual([['DC1', [LINKS[0]]], ['DC1', [LINKS[0]]]])
    })
  }

  it('legacy cards report clicks and keys', async () => {
    const onLinkClick = vi.fn()
    const { container } = render(UpstreamDashboard, { props: { links: LINKS, onLinkClick } })
    const cards = q(container, '.ui-upstream-dashboard__link')
    await fireEvent.click(cards[1])
    await fireEvent.keyDown(cards[1], { key: 'Enter' })
    expect(onLinkClick.mock.calls).toEqual([[LINKS[1]], [LINKS[1]]])
  })

  it('table: rows report clicks; the summary strip clicks and keys', async () => {
    const onLinkClick = vi.fn(), onSummaryClick = vi.fn()
    const { container } = render(UpstreamDashboard, { props: { links: LINKS, mode: 'table', groupBy: 'vendor', onLinkClick, onSummaryClick } })
    const rows = q(container, 'tbody tr')
    expect(rows.map(r => r.firstElementChild?.textContent)).toEqual(['Arista', 'Arista', 'Juniper'])
    await fireEvent.click(rows[2])
    expect(onLinkClick).toHaveBeenLastCalledWith(LINKS[1])
    const top = container.querySelector<HTMLElement>('.ui-upstream-dashboard__table-top-metrics')!
    await fireEvent.click(top)
    await fireEvent.keyDown(top, { key: ' ' })
    expect(onSummaryClick).toHaveBeenCalledTimes(2)
  })

  it('table: sets -webkit-overflow-scrolling, which the contract cannot see (no test engine implements it)', () => {
    const set = vi.spyOn(CSSStyleDeclaration.prototype, 'setProperty')
    try {
      render(UpstreamDashboard, { props: { links: LINKS, mode: 'table' } })
      expect(set).toHaveBeenCalledWith('-webkit-overflow-scrolling', 'touch')
      expect(set).toHaveBeenCalledWith('overflow-x', 'auto')
    } finally { set.mockRestore() }
  })

  it('legacy cards keep the space React puts before the unit (whitespace is content here)', () => {
    const { container } = render(UpstreamDashboard, { props: { links: [{ ...LINKS[0], inbound: 1.25e8 }] } })
    const units = q(container, '.ui-upstream-dashboard__link-unit').map(u => u.textContent)
    expect(units).toEqual([' Gbps', ' bps'])
    expect(container.querySelector('.ui-upstream-dashboard__link-rate')!.textContent).toBe('1.00 Gbps')
  })

  it('a collapsed group keeps its state when links update, as React keys it by group', async () => {
    const { container, rerender } = render(UpstreamDashboard, { props: { links: LINKS, groupBy: 'location', mode: 'compact' } })
    await fireEvent.click(container.querySelector<HTMLElement>('.ui-upstream-dashboard__group-header')!)
    await rerender({ links: [...LINKS, { id: 'd', vendor: 'X', location: 'DC1', inbound: 1, outbound: 1, status: 'ok' }] })
    const first = container.querySelector('section.ui-upstream-dashboard__group')!
    expect(first.hasAttribute('data-collapsed')).toBe(true)
    expect(first.querySelectorAll('.ui-upstream-dashboard__compact-card')).toHaveLength(2)
  })

  it('updates the markup when links change', async () => {
    const { container, rerender } = render(UpstreamDashboard, { props: { links: LINKS, showSummary: true } })
    expect(container.querySelector('[data-testid="summary-inbound"]')!.textContent).toBe('4.80Kbps')
    await rerender({ links: LINKS.slice(0, 1) })
    expect(container.querySelector('[data-testid="summary-inbound"]')!.textContent).toBe('800bps')
    await rerender({ links: [] })
    expect(container.querySelector('.ui-upstream-dashboard__empty')!.textContent!.trim()).toBe('No upstream links configured')
  })
})

describe('formatBitRateSplit / formatRelativeTime', () => {
  it('splits a bit rate at every unit boundary', () => {
    expect(formatBitRateSplit(0)).toEqual({ value: '0', unit: 'bps' })
    expect(formatBitRateSplit(124)).toEqual({ value: '992', unit: 'bps' })
    expect(formatBitRateSplit(125)).toEqual({ value: '1.00', unit: 'Kbps' })
    expect(formatBitRateSplit(125_000)).toEqual({ value: '1.00', unit: 'Mbps' })
    expect(formatBitRateSplit(1.25e8)).toEqual({ value: '1.00', unit: 'Gbps' })
    expect(formatBitRateSplit(1.25e11)).toEqual({ value: '1.00', unit: 'Tbps' })
  })

  it('formats elapsed time in s, m, h and d, never negative', () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(1_000_000_000_000)
    const now = Date.now()
    expect(formatRelativeTime(now + 5000)).toBe('0s ago')
    expect(formatRelativeTime(now - 59_999)).toBe('59s ago')
    expect(formatRelativeTime(now - 60_000)).toBe('1m ago')
    expect(formatRelativeTime(now - 3_600_000)).toBe('1h ago')
    expect(formatRelativeTime(now - 86_400_000 * 3)).toBe('3d ago')
  })
})

/* lib/upstream-dashboard.ts copies React's pure helpers; each must stay
 * token-for-token identical (whitespace and `export` aside). */
describe('lib/upstream-dashboard.ts drift', () => {
  const react = readFileSync(resolve(import.meta.dirname, '../../../../src/domain/upstream-dashboard.tsx'), 'utf8')
  const ours = readFileSync(resolve(import.meta.dirname, '../../src/lib/upstream-dashboard.ts'), 'utf8')
  const fn = (src: string, name: string) => {
    const start = src.search(new RegExp(`(?:export )?function ${name}\\(`))
    if (start < 0) throw new Error(`${name} not found`)
    return src.slice(start, src.indexOf('\n}\n', start) + 2).replace(/^export /, '').replace(/\s+/g, ' ')
  }
  for (const name of ['formatBitRateSplit', 'formatRelativeTime', 'computeUtilization', 'formatTraffic', 'utilColor']) {
    it(`${name} matches React's`, () => expect(fn(ours, name)).toBe(fn(react, name)))
  }
})
