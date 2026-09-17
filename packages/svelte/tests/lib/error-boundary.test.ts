import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { flushSync } from 'svelte'
import Probe from './error-boundary-probe.svelte'

afterEach(() => vi.restoreAllMocks())

describe('ErrorBoundary', () => {
  it('renders children when nothing throws', () => {
    render(Probe, { props: { shouldThrow: () => false } })
    expect(screen.getByText('child ok')).toBeTruthy()
    expect(document.querySelector('[role="alert"]')).toBeNull()
  })

  it('renders React\'s fallback markup and message when a child throws', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(Probe, { props: { shouldThrow: () => true } })
    const alert = document.querySelector('[role="alert"]')!
    expect(alert).not.toBeNull()
    expect(alert.querySelector('.ui-error-boundary__title')!.textContent).toBe('Unable to display component')
    expect(alert.querySelector('.ui-error-boundary__message')!.textContent).toBe('boom')
  })

  it('uses classes, never style attributes, for the fallback', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { container } = render(Probe, { props: { shouldThrow: () => true } })
    expect(container.querySelector('[style]')).toBeNull()
  })

  it('calls onError and logs with the React prefix', () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    const onError = vi.fn()
    render(Probe, { props: { shouldThrow: () => true, onError } })
    expect(onError).toHaveBeenCalledOnce()
    expect(log.mock.calls.some(c => c[0] === '[UI Kit] Component error:')).toBe(true)
  })

  it('Retry re-renders the children once they stop throwing', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    let fail = true
    render(Probe, { props: { shouldThrow: () => fail } })
    expect(document.querySelector('[role="alert"]')).not.toBeNull()
    fail = false
    await userEvent.click(screen.getByText('Retry'))
    flushSync()
    expect(screen.getByText('child ok')).toBeTruthy()
    expect(document.querySelector('[role="alert"]')).toBeNull()
  })
})
