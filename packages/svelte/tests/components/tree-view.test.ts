import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import Probe from './tree-view-probe.svelte'

const NODES = [
  { id: 'src', label: 'src', children: [{ id: 'a', label: 'a.ts' }, { id: 'b', label: 'b.ts', disabled: true }, { id: 'c', label: 'c.ts' }] },
  { id: 'docs', label: 'docs', children: [{ id: 'd', label: 'd.md' }] },
  { id: 'readme', label: 'README' },
]
const item = (c: HTMLElement, id: string) => c.querySelector<HTMLElement>(`[data-node-id="${id}"]`)!
const tree = (c: HTMLElement) => c.querySelector('[role="tree"]')!

describe('TreeView', () => {
  it('a row click toggles an expandable node and selects it; the chevron only toggles; disabled rows do nothing', async () => {
    const onSelect = vi.fn()
    const { container, component } = render(Probe, { props: { nodes: NODES, onSelect } })
    await fireEvent.click(item(container, 'src').querySelector('.ui-tree-view__row')!)
    expect(component.getCalls()).toEqual([['src', true]])
    expect(onSelect).toHaveBeenCalledWith('src')
    await fireEvent.click(item(container, 'docs').querySelector('.ui-tree-view__toggle')!)
    expect(component.getCalls()).toEqual([['src', true], ['docs', true]])
    expect(onSelect).toHaveBeenCalledTimes(1)
    await fireEvent.click(item(container, 'b').querySelector('.ui-tree-view__row')!)
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('makes the first item the tab stop', () => {
    const { container } = render(Probe, { props: { nodes: NODES } })
    flushSync()
    expect(item(container, 'src').getAttribute('tabindex')).toBe('0')
    expect(item(container, 'docs').getAttribute('tabindex')).toBe('-1')
  })

  it('keyboard: down skips disabled, right expands then enters, left collapses then goes to the parent, Home/End, Enter, *', async () => {
    const onSelect = vi.fn()
    const { container, component } = render(Probe, { props: { nodes: NODES, onSelect, initial: ['src'] } })
    const t = tree(container)
    item(container, 'a').focus()
    await fireEvent.keyDown(t, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(item(container, 'c'))
    expect(item(container, 'c').getAttribute('tabindex')).toBe('0')
    await fireEvent.keyDown(t, { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(item(container, 'src'))
    await fireEvent.keyDown(t, { key: 'ArrowRight' })
    expect(document.activeElement).toBe(item(container, 'a'))
    await fireEvent.keyDown(t, { key: 'Enter' })
    expect(onSelect).toHaveBeenCalledWith('a')
    item(container, 'src').focus()
    await fireEvent.keyDown(t, { key: 'ArrowLeft' })
    expect(component.getCalls().at(-1)).toEqual(['src', false])
    await fireEvent.keyDown(t, { key: 'ArrowRight' })
    expect(component.getCalls().at(-1)).toEqual(['src', true])
    await fireEvent.keyDown(t, { key: 'End' })
    expect(document.activeElement).toBe(item(container, 'readme'))
    await fireEvent.keyDown(t, { key: 'Home' })
    expect(document.activeElement).toBe(item(container, 'src'))
    await fireEvent.keyDown(t, { key: '*' })
    expect(component.getCalls().at(-1)).toEqual(['docs', true])
  })

  it('lazy: expanding a node with empty children loads them, showing Loading meanwhile', async () => {
    let resolve!: (n: { id: string; label: string }[]) => void
    const lazy = vi.fn(() => new Promise<{ id: string; label: string }[]>(r => { resolve = r }))
    const nodes = [{ id: 'remote', label: 'remote', children: [] }]
    const { container } = render(Probe, { props: { nodes, lazy } })
    await fireEvent.click(item(container, 'remote').querySelector('.ui-tree-view__toggle')!)
    expect(lazy).toHaveBeenCalledWith('remote')
    expect(container.querySelector('.ui-tree-view__loading')!.textContent).toBe('Loading...')
    resolve([{ id: 'x', label: 'x.ts' }])
    await new Promise(r => setTimeout(r, 0))
    flushSync()
    expect(container.querySelector('.ui-tree-view__loading')).toBeNull()
    expect(item(container, 'x')).not.toBeNull()
  })

  it('lazy: toggling loads before reporting, even when the caller does not expand', async () => {
    const lazy = vi.fn(async () => [{ id: 'z', label: 'z.ts' }])
    const { container, component } = render(Probe, { props: { nodes: [{ id: 'remote', label: 'remote', children: [] }], lazy, ignoreExpand: true } })
    await fireEvent.click(item(container, 'remote').querySelector('.ui-tree-view__toggle')!)
    await new Promise(r => setTimeout(r, 0))
    expect(lazy).toHaveBeenCalledWith('remote')
    expect(component.getCalls()).toEqual([['remote', true]])
  })

  it('lazy: a node expanded from the start loads without interaction', async () => {
    const lazy = vi.fn(async () => [{ id: 'y', label: 'y.ts' }])
    const { container } = render(Probe, { props: { nodes: [{ id: 'remote', label: 'remote', children: [] }], lazy, initial: ['remote'] } })
    await new Promise(r => setTimeout(r, 0))
    flushSync()
    expect(lazy).toHaveBeenCalledOnce()
    expect(item(container, 'y')).not.toBeNull()
  })
})
