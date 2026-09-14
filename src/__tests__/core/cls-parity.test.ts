import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { makeCls } from '../../../packages/svelte/src/lib/cls'
import { useStyles } from '../../core/styles/use-styles'
import { css } from '../../core/styles/css-tag'

/* The Svelte package copies the nine pure lines of useStyles rather than
 * importing it, because importing would pull React into a Svelte bundle. This
 * test is what keeps the copy honest as useStyles evolves. It lives in the
 * React suite because this is where React may be imported. */

const noop = css`.x{}`

describe('cls parity between the React and Svelte class builders', () => {
  const cases: (string | false | null | undefined | 0 | '')[][] = [
    ['root'],
    ['dot'],
    ['root', 'dot'],
    ['root', false, 'icon'],
    [''],
    [0],
    ['root', null, undefined, 0, '', 'remove'],
  ]

  it.each(cases)('produces identical output for %j', (...parts) => {
    const { result } = renderHook(() => useStyles('badge', noop))
    expect(makeCls('badge')(...parts)).toBe(result.current(...parts))
  })
})
