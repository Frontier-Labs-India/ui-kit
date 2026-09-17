import { describe, it, expect, vi, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { render, fireEvent } from '@testing-library/svelte'
import Probe from './plugin-dashboard-probe.svelte'
import PluginDashboard from '../../src/components/PluginDashboard.svelte'
import * as pkg from '../../src/index.js'
import { formatMetricValue, deriveStatus } from '../../src/lib/plugin-dashboard-data.js'

afterEach(() => { vi.unstubAllGlobals() })

describe('PluginDashboard', () => {
  it('lib/plugin-dashboard-data.ts is still a verbatim extract of the React source', () => {
    const react = readFileSync(resolve(import.meta.dirname, '../../../../src/domain/plugin-dashboard.tsx'), 'utf8')
    const ours = readFileSync(resolve(import.meta.dirname, '../../src/lib/plugin-dashboard-data.ts'), 'utf8')
    const formatters = react.slice(react.indexOf('export function formatMetricValue('), react.indexOf('// ─── Property Formatter')).trimEnd()
    const configs = react.slice(react.indexOf('export const POSTGRES_DASHBOARD')).trimEnd()
    expect(ours.endsWith(formatters + '\n\n' + configs + '\n')).toBe(true)
  })

  it('exports the eight built-in configs under React\'s names', () => {
    const names = ['POSTGRES_DASHBOARD', 'MYSQL_DASHBOARD', 'REDIS_DASHBOARD', 'KAFKA_DASHBOARD', 'KUBERNETES_DASHBOARD', 'DOCKER_DASHBOARD', 'NGINX_DASHBOARD', 'ELASTICSEARCH_DASHBOARD']
    for (const n of names) expect((pkg as unknown as Record<string, { name?: string }>)[n]?.name, n).toBeTruthy()
  })

  it('formats and derives status as React does, including inverted thresholds', () => {
    expect(formatMetricValue(1536, 'bytes')).toBe('1.5 KB')
    expect(formatMetricValue(3_661_000, 'duration')).toBe('1h 1m')
    expect(formatMetricValue(null)).toBe('—')
    expect(deriveStatus(85, { warning: 90, critical: 80 })).toBe('warning')
    expect(deriveStatus(96, { warning: 80, critical: 95 })).toBe('critical')
  })

  it('renders a custom widget snippet with the data; section content snippets without parameters still work', () => {
    const { container } = render(Probe, { props: { data: { who: 'svelte' } } })
    expect(container.querySelector('.custom')!.textContent).toBe('svelte')
    expect(container.querySelector('.plain')!.textContent).toBe('zero-arg')
  })

  it('copies a property value', async () => {
    const writeText = vi.fn(() => Promise.resolve())
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    const config = { name: 'P', metrics: [], charts: [], properties: [{ key: 'host', label: 'Host', format: 'code' as const, copyable: true }] }
    const { getByLabelText } = render(PluginDashboard, { props: { config, data: { host: 'db.local' } } })
    await fireEvent.click(getByLabelText('Copy db.local'))
    expect(writeText).toHaveBeenCalledWith('db.local')
  })
})
