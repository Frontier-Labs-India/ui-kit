// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { render } from 'svelte/server'
import Probe from './avatar-group-probe.svelte'

// COMPONENT-API.md rule 2 on the server: see tabs.ssr.test.ts.
describe('AvatarGroup on the server', () => {
  it('renders the registered avatars reversed, with the overflow count', () => {
    const body = render(Probe).body.replace(/<!--[^>]*-->/g, '')
    expect([...body.matchAll(/ui-avatar__initials">(\w+)</g)].map(m => m[1])).toEqual(['GH', 'AL'])
    expect(body).toContain('+1')
    expect([...body.matchAll(/data-size="(\w+)"/g)].map(m => m[1])).toEqual(['sm', 'sm'])
  })
})
