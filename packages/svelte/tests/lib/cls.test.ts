import { describe, it, expect } from 'vitest'
import { makeCls, cn } from '../../src/lib/cls'

describe('makeCls', () => {
  it('maps "root" to the bare prefix', () => {
    expect(makeCls('badge')('root')).toBe('ui-badge')
  })

  it('maps any other part to a BEM-style modifier', () => {
    expect(makeCls('badge')('dot')).toBe('ui-badge--dot')
  })

  it('joins multiple parts with a space', () => {
    expect(makeCls('badge')('root', 'dot')).toBe('ui-badge ui-badge--dot')
  })

  it('drops falsy parts so conditionals can be inlined', () => {
    expect(makeCls('badge')('root', false, null, undefined, 0, '')).toBe('ui-badge')
  })
})

describe('cn', () => {
  it('joins truthy parts and drops the rest', () => {
    expect(cn('a', false, 'b', undefined, null)).toBe('a b')
  })

  it('returns an empty string when nothing is truthy', () => {
    expect(cn(false, null, undefined)).toBe('')
  })
})
