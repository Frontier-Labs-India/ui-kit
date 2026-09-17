import { describe, it, vi } from 'vitest'
import { render, cleanup } from '@testing-library/svelte'
import { flushSync, type Component } from 'svelte'
import { writeFileSync } from 'node:fs'
import * as pkg from '../../src/index.js'
import contract from '../fixtures/contract.json'
import { CONTRACT_NOW } from '../contract/cases.js'
import { hydrate, renamed } from '../contract/hydrate.svelte.js'

/* Input for scripts/check-svelte-whitespace.mjs, which sets WHITESPACE_DUMP to
 * an output path; skipped otherwise. Writes React's server HTML and Svelte's
 * rendered HTML for every contract case, for Chromium to lay out. */
const OUT = process.env.WHITESPACE_DUMP

type Fx = { components: Record<string, Record<string, { props: unknown; html: string }>> }
const cases = (contract as unknown as Fx).components

describe.skipIf(!OUT)('whitespace dump', () => {
  it('writes React and Svelte HTML for every contract case', () => {
    const out: Record<string, { react: string; svelte: string }> = {}
    for (const [name, byCase] of Object.entries(cases)) {
      for (const [caseName, { props, html }] of Object.entries(byCase)) {
        vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] })
        vi.setSystemTime(CONTRACT_NOW)
        const Comp = (pkg as Record<string, unknown>)[name] as Component<any>
        const { container } = render(Comp, { props: hydrate(renamed(name, props)) as Record<string, unknown> })
        flushSync()
        vi.runAllTimers()
        vi.useRealTimers()
        out[`${name} / ${caseName}`] = { react: html, svelte: container.innerHTML }
        cleanup()
      }
    }
    writeFileSync(OUT!, JSON.stringify(out))
  }, 600_000)
})
