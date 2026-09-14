import { describe, it, expect } from 'vitest'
import { mount, unmount } from 'svelte'
import MotionProbe from './motion-probe.svelte'

function render(props: Record<string, unknown>) {
  const target = document.createElement('div')
  document.body.appendChild(target)
  const app = mount(MotionProbe, { target, props })
  return { target, app }
}

describe('getMotionLevel', () => {
  it('defaults to 2 when no provider and no override', () => {
    const { target, app } = render({})
    expect(target.textContent).toBe('2')
    unmount(app)
  })

  it('honours an explicit override over the default', () => {
    const { target, app } = render({ override: 3 })
    expect(target.textContent).toBe('3')
    unmount(app)
  })

  it('honours an override of 0 rather than treating it as absent', () => {
    const { target, app } = render({ override: 0 })
    expect(target.textContent).toBe('0')
    unmount(app)
  })
})
