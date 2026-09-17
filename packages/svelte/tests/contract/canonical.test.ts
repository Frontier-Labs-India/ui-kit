import { describe, it, expect } from 'vitest'
import { canonical, fromHtml } from './canonical.js'

/* The canonical form may only erase differences that carry no meaning. Each
 * normalisation is pinned here from both sides: what it equates, and what it
 * must still tell apart. */
const c = (html: string) => canonical(fromHtml(html))

describe('canonical — style values', () => {
  /* Equality of style values is defined by the CSSOM, not by hand-written
   * rules: both trees are read back through the same parser. These pin that
   * spellings it normalises compare equal, and that real differences survive. */
  it('equates spellings the CSSOM normalises', () => {
    expect(c('<i style="margin:0px"></i>')).toBe(c('<i style="margin:0"></i>'))
    expect(c('<i style="background-color:oklch(65% 0.150 155)"></i>')).toBe(c('<i style="background-color:oklch(0.65 0.15 155)"></i>'))
    expect(c('<i style="color: red ;  width : 1px"></i>')).toBe(c('<i style="width:1px;color:red"></i>'))
  })

  it('still tells real differences apart', () => {
    expect(c('<i style="margin:10px"></i>')).not.toBe(c('<i style="margin:0"></i>'))
    expect(c('<i style="margin:0.5px"></i>')).toContain('0.5px')
    expect(c('<i style="background-color:oklch(65% 0.15 155)"></i>')).not.toBe(c('<i style="background-color:oklch(65% 0.15 156)"></i>'))
    expect(c('<i style="width:50px"></i>')).not.toBe(c('<i style="width:50"></i>')) // the CSSOM drops the bare number
    expect(c('<i style="--x:1"></i>')).not.toBe(c('<i style="--x:2"></i>'))
  })
})

describe('canonical — ids', () => {
  it('equates different generated ids with the same relationship', () => {
    expect(c('<label for="a1">x</label><input id="a1">')).toBe(c('<label for="zz">x</label><input id="zz">'))
  })

  it('maps url(#id) references through the same table', () => {
    const a = '<svg><defs><clipPath id="r1"></clipPath></defs><path clip-path="url(#r1)"></path></svg>'
    const b = '<svg><defs><clipPath id="zz"></clipPath></defs><path clip-path="url(#zz)"></path></svg>'
    const broken = '<svg><defs><clipPath id="zz"></clipPath></defs><path clip-path="url(#other)"></path></svg>'
    expect(c(a)).toBe(c(b))
    expect(c(a)).not.toBe(c(broken))
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
