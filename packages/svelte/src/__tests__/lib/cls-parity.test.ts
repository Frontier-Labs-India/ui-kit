import { describe, it, expect } from 'vitest'
import { makeCls } from '../../lib/cls'
import fixture from '../fixtures/contract.json'

/* The Svelte package copies the nine pure lines of React's useStyles rather
 * than importing them — importing would put React in a Svelte bundle, which
 * check-svelte-no-react.js forbids. This asserts the copy still agrees with
 * React's builder across part combinations the components never produce.
 *
 * The expected values come from the fixture, captured by rendering React's
 * useStyles; they are not written here by hand. */

const cls = (fixture as { cls: { parts: (string | false | null | undefined | 0 | '')[]; expected: string }[] }).cls

describe('cls parity with React\'s useStyles builder', () => {
  it('has cases to check', () => {
    expect(cls.length).toBeGreaterThan(0)
  })

  for (const { parts, expected } of cls) {
    it(`matches for ${JSON.stringify(parts)}`, () => {
      expect(makeCls('badge')(...parts)).toBe(expected)
    })
  }
})
