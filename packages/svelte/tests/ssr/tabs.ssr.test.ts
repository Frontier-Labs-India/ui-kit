// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { render } from 'svelte/server'
import Probe from './tabs-probe.svelte'

/* COMPONENT-API.md rule 2: parts register with their parent while rendering.
 * Server rendering is one pass in template order, so this fails if Tabs ever
 * renders its panels before its children. The client contract cannot see it. */
describe('Tabs on the server', () => {
  it('renders registered TabPanel content inside its panels, and no TabPanel element', () => {
    const { body } = render(Probe)
    const panels = [...body.matchAll(/<div[^>]*role="tabpanel"[^>]*>([\s\S]*?)<\/div>/g)].map(m => m[1].replace(/<!--[^>]*-->/g, ''))
    expect(panels).toEqual(['Panel A', 'Panel B'])
    expect(body).not.toContain('ui-tabs__panel-inner')
  })
})
