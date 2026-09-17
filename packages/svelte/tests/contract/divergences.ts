/* Deliberate structural differences between a Svelte component and its React
 * counterpart, each forced by a React idiom with no Svelte equivalent.
 *
 * Each entry rewrites the SVELTE tree into the shape React emits before the
 * trees are compared, so the difference is stated here as data with its reason
 * rather than hidden by loosening the comparison. A divergence not listed here
 * fails the contract test. */

export type Divergence = { reason: string; apply: (root: ParentNode) => void }

export const DIVERGENCES: Record<string, Divergence[]> = {
  PipelineStage: [
    {
      reason:
        "React renders each step as <li style={{display:'contents'}}> (setProperty, CSP-safe). In Svelte " +
        "markup that is a blocked static style attribute, so Svelte uses .ui-pipeline-stage__li.",
      apply(root) {
        for (const el of Array.from(root.querySelectorAll('li.ui-pipeline-stage__li'))) {
          el.classList.remove('ui-pipeline-stage__li')
          if (!el.classList.length) el.removeAttribute('class')
          el.setAttribute('style', 'display:contents')
        }
      },
    },
  ],
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

/* Inline styles an effect writes after mount. React's server render runs no
 * effects, so its HTML never has them; a React client render writes the same
 * ones. They are set through style properties, which style-src 'self' allows.
 * Only the listed properties on matching elements are removed before the CSP
 * check and the comparison — any other inline style still fails both. */
export const EFFECT_STYLES: Record<string, { selector: string; properties: string[]; reason: string }[]> = {
  SegmentedControl: [
    {
      selector: '.ui-segmented__indicator',
      properties: ['transform', 'inline-size', 'block-size'],
      reason: 'The indicator is measured against the active item in a layout effect and moved with style properties.',
    },
  ],
  Textarea: [
    {
      selector: 'textarea[data-auto-resize]',
      properties: ['height', 'overflow'],
      reason: 'autoResize measures the field in an effect and writes height/overflow, as React does after hydration.',
    },
  ],
}

/* Input values an effect fills in after mount, which React's server HTML
 * therefore lacks. The value on matching inputs is cleared before comparison;
 * what the effect writes is asserted by a behaviour test named in `reason`. */
export const EFFECT_VALUES: Record<string, { selector: string; reason: string }[]> = {
  Combobox: [
    {
      selector: 'input.ui-combobox__input',
      reason: "An effect shows the selected option's label while closed (combobox.test.ts: 'shows the selected label').",
    },
  ],
}

/* Attributes an effect sets after mount (e.g. progress through a reveal).
 * React's server HTML has none of them; the listed attributes are removed from
 * matching elements before comparison, and a behaviour test named in `reason`
 * asserts what the effect sets. */
export const EFFECT_ATTRS: Record<string, { selector: string; attributes: string[]; reason: string }[]> = {
  Highlight: [
    {
      selector: '.ui-highlight',
      attributes: ['data-active'],
      reason: 'Set once in view, or at once at motion 0, by an effect (hero-highlight.test.ts).',
    },
  ],
  TextReveal: [
    {
      selector: '.ui-text-reveal--char',
      attributes: ['data-revealed'],
      reason: 'Characters are revealed by effect timers, or all at once at motion 0 (text-reveal.test.ts).',
    },
  ],
}

/* Props whose NAME differs between the packages, applied to a case's props
 * before the Svelte render — the case file stays in React's shape, and the
 * rename is stated here with its reason. */
/* Applies to every component: React's className is Svelte's class. Cases are
 * written in React's shape, so this is renamed before every Svelte render. */
export const UNIVERSAL_RENAMES: { from: string; to: string; reason: string }[] = [
  { from: 'className', to: 'class', reason: "JSX spells the class attribute className; Svelte uses class." },
]

export const PROP_RENAMES: Record<string, { from: string; to: string; reason: string }[]> = {
  EntityCard: [
    {
      from: 'onClick',
      to: 'onclick',
      reason: "EntityCard's onClick is the card's DOM click handler; Svelte spells DOM handlers in lowercase. " +
        'Not universal: many components take onClick as a custom callback prop with its React name.',
    },
  ],
  OrbitingCircles: [
    {
      from: 'children',
      to: 'items',
      reason:
        'React takes an array of children and wraps each with Children.toArray. A Svelte snippet cannot ' +
        'be split into children, so the Svelte component takes the array as `items`.',
    },
  ],
  TextHighlight: [
    {
      from: 'children',
      to: 'text',
      reason:
        'React reads children as a string and splits it into <mark> runs. A Svelte snippet is opaque — ' +
        'its text cannot be read back — so the Svelte component takes the string as `text`.',
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
