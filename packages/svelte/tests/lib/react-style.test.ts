import { describe, it, expect } from 'vitest'
import { reactStyle, parseStyle, mergeStyles } from '../../src/lib/react-style.js'
import { UNITLESS } from '../../src/lib/unitless.generated.js'
import fixture from '../fixtures/contract.json'

/* reactStyle must serialise a style object exactly as React does. The expected
 * text is React's own server output for the same object, from the fixture. */

const cases = (fixture as { styles: { obj: Record<string, never>; css: string }[] }).styles

const text = (decls: Record<string, string>) =>
  Object.entries(decls).map(([k, v]) => `${k}:${v}`).join(';')

describe('reactStyle matches React\'s style serialisation', () => {
  // Denominator: every unitless property plus the hand-picked objects.
  it('covers every unitless property React knows', () => {
    expect(cases.length).toBeGreaterThanOrEqual(UNITLESS.size + 7)
  })

  for (const { obj, css } of cases) {
    it(JSON.stringify(obj), () => {
      expect(text(reactStyle(obj))).toBe(css)
    })
  }
})

describe('parseStyle and mergeStyles', () => {
  it('parses a declaration string, ignoring empty and malformed parts', () => {
    expect(parseStyle(' color: red ;; --X: 1 ; nonsense; WIDTH: 2px')).toEqual({ color: 'red', '--X': '1', width: '2px' })
  })

  it('keeps colons and semicolons inside url() and quotes', () => {
    expect(parseStyle('background: url(data:image/png;base64,AA); color: red')).toEqual({
      background: 'url(data:image/png;base64,AA)',
      color: 'red',
    })
    expect(parseStyle(`--label: "a;b"; --other: 'c;d'`)).toEqual({ '--label': '"a;b"', '--other': "'c;d'" })
  })

  it('merges left to right with later sources winning, like object spread', () => {
    expect(mergeStyles({ width: 10, '--a': 1 }, 'width: 20px', { color: 'red' })).toEqual({ width: '20px', '--a': '1', color: 'red' })
  })

  it('treats null and undefined sources as empty', () => {
    expect(mergeStyles(null, undefined, { opacity: 0.5 })).toEqual({ opacity: '0.5' })
  })
})
