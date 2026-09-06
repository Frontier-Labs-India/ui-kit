import { describe, it, expect } from 'vitest'
// @ts-expect-error — plain JS build script, no types
import { parseCommit } from '../../../scripts/generate-changelog.js'

const c = (subject: string) => ({ subject, hash: 'abc1234567', date: '2026-09-06' })

describe('conventional commit parsing', () => {
  it('parses an ordinary commit', () => {
    expect(parseCommit(c('fix: something broke'))).toMatchObject({ type: 'fix', description: 'something broke' })
  })

  it('parses a scope', () => {
    expect(parseCommit(c('feat(mcp): add a tool'))).toMatchObject({ type: 'feat', scope: 'mcp' })
  })

  // The whole reason a release is major. Dropping these is the worst possible
  // silent failure in a changelog: `\w+` cannot match "feat!".
  it('parses a breaking change and flags it', () => {
    const e = parseCommit(c('feat!: rename the package'))
    expect(e, 'feat!: must not be dropped').not.toBeNull()
    expect(e).toMatchObject({ type: 'feat', breaking: true, description: 'rename the package' })
  })

  it('parses a breaking change with a scope', () => {
    const e = parseCommit(c('refactor(api)!: drop the legacy export'))
    expect(e, 'refactor(api)!: must not be dropped').not.toBeNull()
    expect(e).toMatchObject({ type: 'refactor', scope: 'api', breaking: true })
  })

  it('still rejects a non-conventional subject', () => {
    expect(parseCommit(c('just some words'))).toBeNull()
  })
})
