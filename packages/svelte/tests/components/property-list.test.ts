import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import PropertyList from '../../src/components/PropertyList.svelte'

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })

describe('PropertyList copy', () => {
  it('copies String(value), marks the row copied, and clears it after 2s', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    vi.useFakeTimers({ toFake: ['setTimeout'] })
    const { container } = render(PropertyList, { props: { motion: 0, items: [{ label: 'Port', value: 8080, copyable: true }] } })
    await fireEvent.click(container.querySelector('button')!)
    await Promise.resolve(); flushSync()
    expect(writeText).toHaveBeenCalledWith('8080')
    expect(container.querySelector('[data-copied]')).not.toBeNull()
    vi.advanceTimersByTime(2000); flushSync()
    expect(container.querySelector('[data-copied]')).toBeNull()
  })
})
