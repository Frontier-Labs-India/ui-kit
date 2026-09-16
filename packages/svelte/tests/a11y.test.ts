import { describe, it, expect, afterEach } from 'vitest'
import { render } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import Badge from '../src/components/Badge.svelte'
import Accordion from '../src/components/Accordion.svelte'
import Checkbox from '../src/components/Checkbox.svelte'
import Drawer from '../src/components/Drawer.svelte'
import TooltipProbe from './components/tooltip-probe.svelte'

/* jest-axe asserts against a DOM node, not a framework, so the React suite's
 * accessibility tooling applies here unchanged.
 *
 * Drawer portals to document.body, so it is checked against document.body —
 * checking `container` would inspect an empty node and report zero violations,
 * a false pass. Each case also asserts the node it checks is non-empty, so that
 * mistake cannot recur silently. */

afterEach(() => {
  document.body.innerHTML = ''
})

async function violations(node: Element) {
  expect(node.innerHTML.length).toBeGreaterThan(0)
  return (await axe(node)).violations.map(v => `${v.id}: ${v.help}`)
}

const items = [
  { id: 'a', trigger: 'First', content: 'Body A' },
  { id: 'b', trigger: 'Second', content: 'Body B' },
]

describe('accessibility', () => {
  it('Badge, including its remove button, has no violations', async () => {
    const { container } = render(Badge, { props: { removable: true, count: 3 } })
    expect(await violations(container)).toEqual([])
  })

  it('Accordion has no violations', async () => {
    const { container } = render(Accordion, { props: { items, defaultOpen: ['a'] } })
    expect(await violations(container)).toEqual([])
  })

  it('Checkbox has no violations, with and without an error', async () => {
    const ok = render(Checkbox, { props: { label: 'Accept' } })
    expect(await violations(ok.container)).toEqual([])
    const err = render(Checkbox, { props: { label: 'Accept', error: 'Required' } })
    expect(await violations(err.container)).toEqual([])
  })

  it('Drawer has no violations, checked where it actually renders', async () => {
    render(Drawer, { props: { open: true, onClose: () => {} } })
    expect(document.body.querySelector('.ui-drawer')).not.toBeNull()
    expect(await violations(document.body)).toEqual([])
  })

  it('Tooltip has no violations while visible', async () => {
    const { container } = render(TooltipProbe, { props: { content: 'Help', delay: 0 } })
    await userEvent.hover(container.querySelector('.ui-tooltip-trigger')!)
    await new Promise(r => setTimeout(r, 10))
    expect(container.querySelector('[role="tooltip"]')).not.toBeNull()
    expect(await violations(container)).toEqual([])
  })
})
