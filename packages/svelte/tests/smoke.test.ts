import { describe, it, expect } from 'vitest'
import { mount, unmount } from 'svelte'
import Probe from './probe.svelte'

describe('svelte toolchain', () => {
  it('mounts a component into jsdom', () => {
    const target = document.createElement('div')
    document.body.appendChild(target)
    const app = mount(Probe, { target })
    expect(target.textContent).toBe('ok')
    unmount(app)
  })
})
