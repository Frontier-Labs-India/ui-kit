import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent } from '@testing-library/svelte'
import DashboardTemplate from '../../src/components/DashboardTemplate.svelte'

afterEach(() => { vi.useRealTimers() })

describe('DashboardTemplate', () => {
  it('sections collapse independently from their defaults and report toggles', async () => {
    const onSectionToggle = vi.fn()
    const sections = [
      { id: 'a', title: 'A', collapsible: true, content: 'a' },
      { id: 'b', title: 'B', collapsible: true, defaultCollapsed: true, content: 'b' },
    ]
    const { container, getByLabelText } = render(DashboardTemplate, { props: { sections, onSectionToggle } })
    const content = () => Array.from(container.querySelectorAll('.ui-dashboard-template__section-content')).map(c => c.hasAttribute('data-collapsed'))
    expect(content()).toEqual([false, true])
    await fireEvent.click(getByLabelText('Collapse A'))
    expect(onSectionToggle).toHaveBeenLastCalledWith('a', true)
    await fireEvent.click(getByLabelText('Expand B'))
    expect(onSectionToggle).toHaveBeenLastCalledWith('b', false)
    expect(content()).toEqual([true, false])
    expect(getByLabelText('Expand A').getAttribute('aria-expanded')).toBe('false')
  })

  it('the sidebar collapses (dropping its content and the column template); metrics are clickable by key', async () => {
    const onMetricClick = vi.fn()
    const metrics = [{ id: 'm', title: 'M', value: '1' }]
    const { container, getByLabelText, getByRole } = render(DashboardTemplate, {
      props: { sidebar: 'Side', sidebarCollapsible: true, sidebarWidth: 240, metrics, onMetricClick },
    })
    const body = container.querySelector<HTMLElement>('.ui-dashboard-template__body')!
    expect(body.style.gridTemplateColumns).toBe('1fr var(--dt-sidebar-w, 280px)')
    await fireEvent.click(getByLabelText('Collapse sidebar'))
    expect(body.getAttribute('data-sidebar')).toBe('none')
    expect(body.style.gridTemplateColumns).toBe('')
    expect(container.querySelector('aside')!.textContent).not.toContain('Side')
    await fireEvent.keyDown(getByRole('button', { name: 'M: 1' }), { key: 'Enter' })
    expect(onMetricClick).toHaveBeenCalledWith(metrics[0])
  })

  it('calls onRefresh every autoRefresh ms and stops when destroyed', () => {
    vi.useFakeTimers()
    const onRefresh = vi.fn()
    const { unmount } = render(DashboardTemplate, { props: { autoRefresh: 1000, onRefresh } })
    vi.advanceTimersByTime(3500)
    expect(onRefresh).toHaveBeenCalledTimes(3)
    unmount()
    vi.advanceTimersByTime(5000)
    expect(onRefresh).toHaveBeenCalledTimes(3)
  })
})
