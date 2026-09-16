import { describe, it, expect } from 'vitest'
import { portal } from '../../src/actions/portal'

describe('portal', () => {
  it('moves the node to document.body', () => {
    const parent = document.createElement('div')
    const node = document.createElement('div')
    parent.appendChild(node)
    document.body.appendChild(parent)
    portal(node)
    expect(node.parentElement).toBe(document.body)
  })

  it('removes the node entirely on destroy, not back to a detached parent', () => {
    const node = document.createElement('div')
    document.body.appendChild(node)
    const action = portal(node)
    action.destroy()
    expect(document.body.contains(node)).toBe(false)
  })

  it('honours an explicit target', () => {
    const target = document.createElement('section')
    document.body.appendChild(target)
    const node = document.createElement('div')
    portal(node, target)
    expect(node.parentElement).toBe(target)
  })

  it('a scope root still matches after relocation — @scope is not positional', () => {
    // The assumption Drawer depends on, and the one the design spec left open.
    // If this ever fails, the 7 portal components need unscoped duplicates.
    const node = document.createElement('div')
    node.className = 'ui-drawer'
    const nested = document.createElement('span')
    nested.className = 'ui-drawer__panel'
    node.appendChild(nested)
    document.body.appendChild(node)

    portal(node)

    expect(node.matches('.ui-drawer')).toBe(true)
    expect(node.parentElement).toBe(document.body)
    // The subtree travels with its root, which is what keeps @scope matching.
    expect(node.contains(nested)).toBe(true)
    expect(nested.closest('.ui-drawer')).toBe(node)
  })
})
