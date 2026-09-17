import { describe, it, expect, afterEach, vi } from 'vitest'
import { mount, unmount } from 'svelte'
import MotionProbe from './motion-probe.svelte'

function render(props: Record<string, unknown>) {
  const target = document.createElement('div')
  document.body.appendChild(target)
  const app = mount(MotionProbe, { target, props })
  return { target, app }
}

function setReducedMotion(matches: boolean) {
  vi.stubGlobal('matchMedia', (q: string) => ({
    matches: q.includes('prefers-reduced-motion') ? matches : false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
  }))
}

afterEach(() => vi.unstubAllGlobals())

describe('getMotionLevel', () => {
  it('defaults to 3, matching React\'s MotionContext default', () => {
    const { target, app } = render({})
    expect(target.textContent).toBe('3')
    unmount(app)
  })

  it('honours an explicit override over the default', () => {
    const { target, app } = render({ override: 1 })
    expect(target.textContent).toBe('1')
    unmount(app)
  })

  it('honours an override of 0 rather than treating it as absent', () => {
    const { target, app } = render({ override: 0 })
    expect(target.textContent).toBe('0')
    unmount(app)
  })

  it('returns 0 under prefers-reduced-motion', () => {
    setReducedMotion(true)
    const { target, app } = render({})
    expect(target.textContent).toBe('0')
    unmount(app)
  })

  it('lets prefers-reduced-motion override even an explicit prop, as React does', () => {
    setReducedMotion(true)
    const { target, app } = render({ override: 3 })
    expect(target.textContent).toBe('0')
    unmount(app)
  })

  it('tracks a later change to the override, as React re-running the hook does', async () => {
    // The override is a getter for exactly this reason: a component's <script>
    // body runs once, so passing the value would snapshot it at init.
    const { render: tlRender } = await import('@testing-library/svelte')
    const { container, rerender } = tlRender(MotionProbe, { props: { override: 1 } })
    expect(container.textContent).toBe('1')
    await rerender({ override: 0 })
    expect(container.textContent).toBe('0')
  })

  it('ignores the media query when it does not match', () => {
    setReducedMotion(false)
    const { target, app } = render({})
    expect(target.textContent).toBe('3')
    unmount(app)
  })
})
