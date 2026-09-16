/* Deliberate structural differences between a Svelte component and its React
 * counterpart, each forced by a React idiom with no Svelte equivalent.
 *
 * Each entry rewrites the SVELTE tree into the shape React emits before the
 * trees are compared, so the difference is stated here as data with its reason
 * rather than hidden by loosening the comparison. A divergence not listed here
 * fails the contract test. */

export type Divergence = { reason: string; apply: (root: ParentNode) => void }

export const DIVERGENCES: Record<string, Divergence[]> = {
  Checkbox: [
    {
      reason:
        "React lays out this row with style={{display:'inline-flex',…}}, which react-dom applies via " +
        "setProperty and is CSP-safe. In Svelte markup that is a static style attribute, which " +
        "style-src 'self' blocks, so Svelte uses the class .ui-checkbox__row carrying the same rules.",
      apply(root) {
        for (const el of Array.from(root.querySelectorAll('.ui-checkbox__row'))) {
          el.classList.remove('ui-checkbox__row')
          if (!el.classList.length) el.removeAttribute('class')
          el.setAttribute('style', 'display:inline-flex;align-items:flex-start;gap:inherit')
        }
      },
    },
  ],
}

/* Exported components that cannot join the SSR-generated contract, and why.
 * The contract test fails for any exported component missing from both the
 * fixture and this list, so a new port cannot skip the contract silently. */
export const NO_SSR_CONTRACT: Record<string, string> = {
  ComponentErrorBoundary: 'not a component in component-meta — renders its children unchanged; failure path asserted in tests/lib/error-boundary.test.ts',
  Drawer: 'returns null on the server (needs `document` to portal); contract asserted in drawer.test.ts',
  Tooltip: 'its panel exists only after hover state, which SSR never runs; contract asserted in tooltip.test.ts',
}
