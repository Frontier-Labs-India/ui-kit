import { describe, it, expect, vi } from 'vitest'
import { captureElement, mergeProps } from '../../src/lib/trigger-props.js'

describe('captureElement', () => {
  it('is one symbol-keyed attachment that reports the element, then null on removal', () => {
    const set = vi.fn()
    const capture = captureElement(set)
    expect(Object.keys(capture)).toEqual([])
    const keys = Object.getOwnPropertySymbols(capture)
    expect(keys).toHaveLength(1)
    const el = document.createElement('button')
    const cleanup = capture[keys[0]](el)
    expect(set).toHaveBeenLastCalledWith(el)
    cleanup()
    expect(set).toHaveBeenLastCalledWith(null)
  })

  it('survives an object spread, so components can build props with `{ ...capture, title }`', () => {
    const capture = captureElement(() => {})
    expect(Object.getOwnPropertySymbols({ ...capture, title: 'x' })).toEqual(Object.getOwnPropertySymbols(capture))
  })
})

describe('mergeProps', () => {
  it('chains handlers on both sides, the component first', () => {
    const calls: string[] = []
    const merged = mergeProps({ onclick: () => calls.push('component') }, { onclick: () => calls.push('caller') })
    ;(merged.onclick as () => void)()
    expect(calls).toEqual(['component', 'caller'])
  })

  it('passes the event to both handlers', () => {
    const a = vi.fn(), b = vi.fn()
    const event = new MouseEvent('click')
    ;(mergeProps({ onclick: a }, { onclick: b }).onclick as (e: Event) => void)(event)
    expect(a).toHaveBeenCalledWith(event)
    expect(b).toHaveBeenCalledWith(event)
  })

  it('joins class, lets other caller values win, and keeps attachments', () => {
    const capture = captureElement(() => {})
    const merged = mergeProps({ ...capture, class: 'theirs', title: 'a', 'aria-expanded': 'false' }, { class: 'mine', title: 'b', onkeydown: () => {} })
    expect(merged.class).toBe('theirs mine')
    expect(merged.title).toBe('b')
    expect(merged['aria-expanded']).toBe('false')
    expect(typeof merged.onkeydown).toBe('function')
    expect(Object.getOwnPropertySymbols(merged)).toEqual(Object.getOwnPropertySymbols(capture))
  })

  it('does not chain a handler present on only one side, or a non-function', () => {
    const own = vi.fn()
    expect(mergeProps({}, { onclick: own }).onclick).toBe(own)
    expect(mergeProps({ onclick: null }, { onclick: own }).onclick).toBe(own)
    expect(mergeProps({ one: 1 }, { one: 2 }).one).toBe(2)
  })
})
