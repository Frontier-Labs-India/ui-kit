import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/svelte'
import { createRawSnippet, flushSync, type Component } from 'svelte'
import SpotlightCard from '../../src/components/SpotlightCard.svelte'
import GlowCard from '../../src/components/GlowCard.svelte'
import Card3D from '../../src/components/Card3D.svelte'

const children = createRawSnippet(() => ({ render: () => '<b>c</b>' }))
const rect = (el: Element, r: Partial<DOMRect>) =>
  vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 0, height: 0, ...r } as DOMRect)

describe.each([
  ['SpotlightCard', SpotlightCard, '.ui-spotlight-card', '--spotlight-x', '--spotlight-y', '--spotlight-card-color', 'spotlightColor'],
  ['GlowCard', GlowCard, '.ui-glow-card', '--glow-x', '--glow-y', '--glow-card-color', 'glowColor'],
] as const)('%s', (_name, Comp, root, xVar, yVar, colorVar, colorProp) => {
  const mount = (props: Record<string, unknown> = {}) => {
    const r = render(Comp as Component<any>, { props: { children, ...props } })
    return { ...r, el: r.container.querySelector(root) as HTMLElement }
  }

  it('writes the pointer position relative to the card', async () => {
    const { el } = mount()
    rect(el, { left: 10, top: 20 })
    await fireEvent.mouseMove(el, { clientX: 40, clientY: 70 })
    expect(el.style.getPropertyValue(xVar)).toBe('30px')
    expect(el.style.getPropertyValue(yVar)).toBe('50px')
  })

  it('writes nothing at motion 0', async () => {
    const { el } = mount({ motion: 0 })
    await fireEvent.mouseMove(el, { clientX: 40, clientY: 70 })
    expect(el.style.getPropertyValue(xVar)).toBe('')
  })

  it('reflects hover as data-hovering="true" and removes it on leave', async () => {
    const { el } = mount()
    await fireEvent.mouseEnter(el)
    expect(el.getAttribute('data-hovering')).toBe('true')
    await fireEvent.mouseLeave(el)
    expect(el.hasAttribute('data-hovering')).toBe(false)
  })

  it("calls the caller's own mouse handlers", async () => {
    const onmousemove = vi.fn(), onmouseenter = vi.fn(), onmouseleave = vi.fn()
    const { el } = mount({ onmousemove, onmouseenter, onmouseleave })
    await fireEvent.mouseEnter(el); await fireEvent.mouseMove(el); await fireEvent.mouseLeave(el)
    expect([onmouseenter, onmousemove, onmouseleave].map(f => f.mock.calls.length)).toEqual([1, 1, 1])
  })

  it('keeps the pointer position when a prop change re-applies styles', async () => {
    const { el, rerender } = mount({ [colorProp]: 'red' })
    rect(el, {})
    await fireEvent.mouseMove(el, { clientX: 5, clientY: 6 })
    await rerender({ children, [colorProp]: 'blue' })
    flushSync()
    expect(el.style.getPropertyValue(colorVar)).toBe('blue')
    expect(el.style.getPropertyValue(xVar)).toBe('5px')
  })
})

describe('Card3D', () => {
  const mount = (props: Record<string, unknown> = {}) => {
    const r = render(Card3D, { props: { children, ...props } })
    return { ...r, outer: r.container.querySelector('.ui-card-3d') as HTMLElement, inner: r.container.querySelector('.ui-card-3d--inner') as HTMLElement }
  }

  it('tilts toward the pointer: right edge tilts +maxTilt on Y, top edge +maxTilt on X', async () => {
    const { outer, inner } = mount({ maxTilt: 12 })
    rect(inner, { left: 0, top: 0, width: 200, height: 100 })
    await fireEvent.mouseMove(outer, { clientX: 200, clientY: 0 })
    expect(inner.style.getPropertyValue('--tilt-y')).toBe('12deg')
    expect(inner.style.getPropertyValue('--tilt-x')).toBe('12deg')
  })

  it('caps glare opacity at 0.2 and omits glare work when glare is false', async () => {
    const a = mount()
    rect(a.inner, { width: 200, height: 100 })
    await fireEvent.mouseMove(a.outer, { clientX: 200, clientY: 100 })
    expect(a.inner.style.getPropertyValue('--glare-opacity')).toBe('0.2')

    const b = mount({ glare: false })
    rect(b.inner, { width: 200, height: 100 })
    await fireEvent.mouseMove(b.outer, { clientX: 200, clientY: 100 })
    expect(b.inner.style.getPropertyValue('--glare-opacity')).toBe('')
    expect(b.container.querySelector('.ui-card-3d--glare')).toBeNull()
  })

  it('resets tilt and glare on leave', async () => {
    const { outer, inner } = mount()
    rect(inner, { width: 200, height: 100 })
    await fireEvent.mouseMove(outer, { clientX: 0, clientY: 0 })
    await fireEvent.mouseLeave(outer)
    expect([inner.style.getPropertyValue('--tilt-x'), inner.style.getPropertyValue('--tilt-y'), inner.style.getPropertyValue('--glare-opacity')]).toEqual(['0deg', '0deg', '0'])
  })

  it('does nothing at motion 0', async () => {
    const { outer, inner } = mount({ motion: 0 })
    rect(inner, { width: 200, height: 100 })
    await fireEvent.mouseMove(outer, { clientX: 200, clientY: 0 })
    expect(inner.style.getPropertyValue('--tilt-y')).toBe('')
  })
})
