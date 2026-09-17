import { describe, it, expect } from 'vitest'
import { canonical, fromHtml } from './canonical.js'

/* The canonical form may only erase differences that carry no meaning. Each
 * normalisation is pinned here from both sides: what it equates, and what it
 * must still tell apart. */
const c = (html: string) => canonical(fromHtml(html))

describe('canonical — zero lengths', () => {
  it('equates 0px with 0, alone and inside lists and functions', () => {
    expect(c('<i style="margin:0px"></i>')).toBe(c('<i style="margin:0"></i>'))
    expect(c('<i style="inset:0px 0px 0px 0px"></i>')).toBe(c('<i style="inset:0 0 0 0"></i>'))
    expect(c('<i style="width:calc(100% - 0px)"></i>')).toBe(c('<i style="width:calc(100% - 0)"></i>'))
  })

  it('still tells real lengths apart', () => {
    expect(c('<i style="margin:10px"></i>')).not.toBe(c('<i style="margin:0"></i>'))
    expect(c('<i style="margin:0.5px"></i>')).toContain('0.5px')
    expect(c('<i style="margin:100px"></i>')).toContain('100px')
  })
})

describe('canonical — ids', () => {
  it('equates different generated ids with the same relationship', () => {
    expect(c('<label for="a1">x</label><input id="a1">')).toBe(c('<label for="zz">x</label><input id="zz">'))
  })

  it('tells a broken relationship apart', () => {
    expect(c('<label for="a">x</label><input id="b">')).not.toBe(c('<label for="a">x</label><input id="a">'))
  })
})

describe('canonical — ordering and text', () => {
  it('ignores attribute order, class order and style formatting', () => {
    expect(c('<i class="b a" data-x="1" style="color: red; width: 1px;"></i>'))
      .toBe(c('<i data-x="1" class="a b" style="width:1px;color:red"></i>'))
  })

  it('merges text across comment separators but keeps text content', () => {
    expect(c('<b>a<!-- -->b</b>')).toBe(c('<b>ab</b>'))
    expect(c('<b>a</b>')).not.toBe(c('<b>b</b>'))
  })
})
