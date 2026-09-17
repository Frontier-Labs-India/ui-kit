import { describe, it, expect, vi, afterEach } from 'vitest'
import { render } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import Probe from './container-query-probe.svelte'

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks() })

describe('ContainerQuery', () => {
  it('passes the observed size to the snippet, one frame per burst, preferring borderBoxSize', () => {
    let cb: ResizeObserverCallback | undefined
    const disconnect = vi.fn()
    vi.stubGlobal('ResizeObserver', class { constructor(c: ResizeObserverCallback) { cb = c } observe() {} disconnect() { disconnect() } })
    const frames: FrameRequestCallback[] = []
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(f => { frames.push(f); return frames.length })
    const cancel = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})

    const { container, unmount } = render(Probe)
    const out = () => container.querySelector('output')!.textContent
    expect(out()).toBe('0x0 xs')

    const entry = (w: number, h: number, box = false) => ({
      contentRect: { width: w, height: h },
      borderBoxSize: box ? [{ inlineSize: w + 10, blockSize: h + 10 }] : [],
    }) as unknown as ResizeObserverEntry
    cb!([entry(300, 100)], {} as ResizeObserver)
    cb!([entry(500, 200)], {} as ResizeObserver)
    expect(cancel).toHaveBeenCalledWith(1)
    frames[1](0)
    flushSync()
    expect(out()).toBe('500x200 md')

    cb!([entry(700, 50, true)], {} as ResizeObserver)
    frames[2](0)
    flushSync()
    expect(out()).toBe('710x60 lg')

    unmount()
    expect(disconnect).toHaveBeenCalledOnce()
  })
})
