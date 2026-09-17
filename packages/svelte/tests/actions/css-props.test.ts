import { describe, it, expect, vi } from 'vitest'
import { cssProps } from '../../src/actions/css-props'

describe('cssProps', () => {
  it('sets properties via setProperty, never cssText', () => {
    const node = document.createElement('div')
    const spy = vi.spyOn(node.style, 'setProperty')
    const cssTextSetter = vi.fn()
    Object.defineProperty(node.style, 'cssText', { set: cssTextSetter, get: () => '' })

    cssProps(node, { '--depth': 2, height: '40px' })

    expect(spy).toHaveBeenCalledWith('--depth', '2')
    expect(spy).toHaveBeenCalledWith('height', '40px')
    expect(cssTextSetter).not.toHaveBeenCalled()
  })

  it('removes a property that becomes absent on update', () => {
    const node = document.createElement('div')
    const action = cssProps(node, { height: '40px', width: '10px' })
    action.update({ height: '40px' })
    expect(node.style.getPropertyValue('width')).toBe('')
    expect(node.style.getPropertyValue('height')).toBe('40px')
  })

  it('treats null and undefined as removal, not as the string "null"', () => {
    const node = document.createElement('div')
    const action = cssProps(node, { height: '40px' })
    action.update({ height: null })
    expect(node.style.getPropertyValue('height')).toBe('')
  })

  it('clears everything it set on destroy', () => {
    const node = document.createElement('div')
    const action = cssProps(node, { '--x': 1, '--y': 2 })
    action.destroy()
    expect(node.style.getPropertyValue('--x')).toBe('')
    expect(node.style.getPropertyValue('--y')).toBe('')
  })
})
