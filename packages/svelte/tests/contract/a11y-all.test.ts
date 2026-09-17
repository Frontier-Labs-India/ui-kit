import { describe, it, expect, vi, afterAll } from 'vitest'
import { render } from '@testing-library/svelte'
import { createRawSnippet, type Component } from 'svelte'
import { axe } from 'jest-axe'
import * as pkg from '../../src/index.js'
import fixture from '../fixtures/contract.json'
import { CASES, CONTRACT_NOW } from './cases.js'
import { PROP_RENAMES, UNIVERSAL_RENAMES } from './divergences.js'

/* jest-axe over every case of every contract-tested component — not a
 * hand-picked few — so each new port is checked without writing a test.
 *
 * Because the contract test proves these trees equal React's, a violation here
 * is present in the React package too. Such a violation is recorded in
 * INHERITED with its reason rather than hidden; fixing it belongs in both
 * packages at once, or the contract would break. */

type Fx = { components: Record<string, Record<string, { props: unknown; html: string }>> }
const f = fixture as unknown as Fx

function renamed(name: string, props: unknown): Record<string, unknown> {
  const out = { ...(props as Record<string, unknown>) }
  for (const { from, to } of [...UNIVERSAL_RENAMES, ...(PROP_RENAMES[name] ?? [])]) {
    if (from in out) { out[to] = out[from]; delete out[from] }
  }
  return out
}

function hydrate(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(hydrate)
  if (value && typeof value === 'object') {
    const v = value as Record<string, unknown>
    if ('$el' in v) return createRawSnippet(() => ({ render: () => `<b>${String(v.$el)}</b>` }))
    if ('$fn' in v) return () => {}
    if ('$date' in v) return new Date(String(v.$date))
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, hydrate(x)]))
  }
  return value
}

const CALLER_MUST_NAME =
  'case deliberately omits the accessible name, which only the caller can supply — ' +
  'the contract cases exercise markup, including this unlabelled form'
const PULSE_DEFECT =
  'DEFECT in both packages: StatusPulse hard-codes role="img" but `label` is optional, so every ' +
  'unlabelled use is an image with no name. Fix together (require label, or drop the role without one) ' +
  'or the DOM contract breaks'

const DISK_DEFECT =
  'DEFECT in both packages: DiskMountBar puts role="list" on its root, but its listitems sit inside a ' +
  'plain wrapper div, beside a toggle button and a footer that are not listitems. Fix together (move ' +
  'the role to the wrapper) or the contract breaks'

const SLIDER_NAME =
  CALLER_MUST_NAME + '. Slider-specific, inherited: a caller aria-label lands on the wrapper div, not ' +
  'the range input, so the `label` prop is the only way to name the slider'

const PASSWORD_METER_DEFECT =
  'DEFECT in both packages: PasswordInput\'s strength bar is role="meter" with no accessible name. ' +
  'Fix together (aria-label, or aria-labelledby the strength label) or the contract breaks'

const CALENDAR_DEFECT =
  'DEFECT in both packages: Calendar puts role="gridcell" day buttons directly inside role="grid", ' +
  'laid out by CSS grid with no role="row" wrappers, so the grid has no rows and the cells no row ' +
  'parent. Fix together (row wrappers with display:contents, or drop the grid roles) or the contract breaks'

/** `Component/case/rule-id` -> why it is accepted for now. */
const INHERITED: Record<string, string> = {
  'Checkbox/defaults/label': CALLER_MUST_NAME,
  'Checkbox/disabled/label': CALLER_MUST_NAME,
  'Checkbox/indeterminate/label': CALLER_MUST_NAME,
  'Checkbox/motion 0/label': CALLER_MUST_NAME,
  'FormInput/name only/label': CALLER_MUST_NAME,
  'Select/no label (unnamed trigger)/button-name':
    CALLER_MUST_NAME + '. Select-specific, inherited: a caller aria-label lands on the root div, so `label` is the only way to name the trigger',
  'Link/external defaults/link-name': CALLER_MUST_NAME,
  'Link/external keeps caller target and rel/link-name': CALLER_MUST_NAME,
  'Link/not external passes target through/link-name': CALLER_MUST_NAME,
  'Progress/indeterminate/aria-progressbar-name': CALLER_MUST_NAME,
  'Progress/zero/aria-progressbar-name': CALLER_MUST_NAME,
  'Progress/clamped over max/aria-progressbar-name': CALLER_MUST_NAME,
  'Progress/clamped negative/aria-progressbar-name': CALLER_MUST_NAME,
  'Progress/motion 0/aria-progressbar-name': CALLER_MUST_NAME,
  'RingChart/empty-string label renders empty centre/aria-meter-name':
    'inherited from React: aria-label uses `typeof label === "string"`, so an explicit empty label ' +
    'yields aria-label="" instead of the "Ring chart" fallback. Minor — needs a caller to pass "" — ' +
    'and fixable only in both packages together',
  'DiskMountBar/sorted, collapsed at 3/aria-required-children': DISK_DEFECT,
  'DiskMountBar/no mounts/aria-required-children': DISK_DEFECT,
  'DiskMountBar/motion 0/aria-required-children': DISK_DEFECT,
  'Slider/defaults/label': SLIDER_NAME,
  'Slider/controlled, custom range, disabled xl/label': SLIDER_NAME,
  'Slider/min equals max/label': SLIDER_NAME,
  'Slider/ticks capped at 101/label': SLIDER_NAME,
  'Slider/motion 0/label': SLIDER_NAME,
  // Every Calendar case renders the grid, so every case carries the defect; the
  // stale-entry check below still fails if a case stops producing it.
  ...Object.fromEntries(Object.keys(CASES.Calendar).flatMap(c =>
    ['aria-required-children', 'aria-required-parent'].map(rule => [`Calendar/${c}/${rule}`, CALENDAR_DEFECT]))),
  'PasswordInput/strength meter empty/aria-meter-name': PASSWORD_METER_DEFECT,
  'PasswordInput/strength meter strong with error/aria-meter-name': PASSWORD_METER_DEFECT,
  'PasswordInput/strength meter fair, custom labels, sm disabled, caller id/aria-meter-name': PASSWORD_METER_DEFECT,
  'TimePicker/value with clear, lg, name/nested-interactive':
    'DEFECT in both packages: TimePicker\'s clear control is a role="button" span inside the trigger <button>, ' +
    'whose children are presentational, so it is unreachable to assistive technology. Fix together (move the ' +
    'clear control beside the trigger) or the contract breaks',
  'StatusPulse/ok/role-img-alt': PULSE_DEFECT,
  'StatusPulse/warning/role-img-alt': PULSE_DEFECT,
  'StatusPulse/info motion 0/role-img-alt': PULSE_DEFECT,
}

describe('accessibility — every contract case', () => {
  // Same clock as the generator, so relative times render identically. Date
  // and setTimeout are faked; microtasks are not, so Svelte's scheduling is
  // untouched. setTimeout is faked so an entrance animation (useEntrance) can be
  // run to its settled state — React's server render never runs effects, so the
  // settled DOM is the fair comparison.
  // Fake clocks only around the render: axe-core schedules its own work with
  // setTimeout, so faked timers must be restored before axe runs or it never
  // resolves. The DOM is fully rendered and settled by then.
  afterAll(() => { vi.useRealTimers() })

  const seen = new Set<string>()

  for (const [name, cases] of Object.entries(f.components)) {
    for (const [caseName, { props }] of Object.entries(cases)) {
      it(`${name} / ${caseName}`, async () => {
        const Comp = (pkg as Record<string, unknown>)[name] as Component<any>
        vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] })
        vi.setSystemTime(CONTRACT_NOW)
        const { container } = render(Comp, { props: hydrate(renamed(name, props)) as Record<string, unknown> })
        vi.runAllTimers()
        vi.useRealTimers()
        expect(container.innerHTML.length).toBeGreaterThan(0)
        const found = (await axe(container)).violations.map(v => `${name}/${caseName}/${v.id}`)
        found.forEach(k => seen.add(k))
        expect(found.filter(k => !(k in INHERITED))).toEqual([])
      })
    }
  }

  it('has no stale INHERITED entries', () => {
    expect(Object.keys(INHERITED).filter(k => !seen.has(k))).toEqual([])
  })
})
