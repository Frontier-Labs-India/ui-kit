/* Prop cases for the React ↔ Svelte DOM contract.
 *
 * scripts/generate-contract-fixtures.tsx renders each case with the React
 * component and stores the server HTML; tests/contract/contract.test.ts renders
 * the same case with the Svelte component and compares the full DOM trees.
 *
 * Plain JSON-able data, so both sides read one source. Two encodings stand in
 * for things JSON cannot carry:
 *   { $el: 'text' }  a rendered child — React <b>text</b>, Svelte a snippet of the same
 *   { $fn: true }    a callback — a no-op on both sides; some markup exists only
 *                    when a handler is passed (e.g. a close button)
 *
 * Choose cases that change the MARKUP: every variant/size value that is an
 * attribute, every boolean that adds or removes an element, and the edge values
 * (0, empty, over-max). A case that renders the same tree as another adds
 * nothing. */

export type CaseProps = Record<string, unknown>
export const CASES: Record<string, Record<string, CaseProps>> = {
  Accordion: {
    empty: { items: [] },
    'variant+size': { items: [], variant: 'bordered', size: 'lg' },
    'motion 0': { items: [], motion: 0 },
    items: {
      items: [
        { id: 'a', trigger: 'First', content: 'Body A' },
        { id: 'b', trigger: { $el: 'Second' }, content: { $el: 'Body B' }, disabled: true },
      ],
      defaultOpen: ['a'],
    },
  },
  Badge: {
    defaults: {},
    'variant+size': { variant: 'danger', size: 'xl' },
    outline: { outline: true },
    'dot+pulse': { dot: true, pulse: true },
    'count over max': { count: 150, maxCount: 99 },
    'count zero': { count: 0 },
    'motion 0': { motion: 0 },
    removable: { removable: true },
    children: { children: { $el: 'Label' } },
  },
  Checkbox: {
    defaults: {},
    label: { label: 'Accept' },
    size: { size: 'xl', label: 'Accept' },
    indeterminate: { indeterminate: true },
    disabled: { disabled: true },
    error: { label: 'Accept', error: 'Required' },
    'rest to input': { label: 'Accept', name: 'terms', value: 'yes' },
    'motion 0': { motion: 0 },
  },
}
