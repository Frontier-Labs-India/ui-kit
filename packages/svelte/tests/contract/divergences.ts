/* Deliberate structural differences between a Svelte component and its React
 * counterpart, each forced by a React idiom with no Svelte equivalent.
 *
 * Each entry rewrites the SVELTE tree into the shape React emits before the
 * trees are compared, so the difference is stated here as data with its reason
 * rather than hidden by loosening the comparison. A divergence not listed here
 * fails the contract test. */

export type Divergence = { reason: string; apply: (root: ParentNode) => void }

export const DIVERGENCES: Record<string, Divergence[]> = {
  TreeView: [
    {
      reason:
        'React nests a child <li> inside div.ui-tree-view__group > div inside its parent <li>. Client DOM keeps ' +
        'that, as Svelte\'s does, but the HTML parser\'s <li> rule closes the open <li> across the divs, so the ' +
        'server-HTML fixture is re-parented (a hydration hazard in both packages, see the README). Re-parsing the ' +
        'Svelte tree applies the same parser rule.',
      apply(root) {
        const el = root as Element
        el.innerHTML = el.innerHTML
      },
    },
  ],
  Tabs: [
    {
      reason:
        'React nests the close <button> inside the tab <button> (an inherited defect, see a11y-all). Its ' +
        'client DOM keeps the nesting, as Svelte\'s does; only the fixture differs, because parsing server ' +
        'HTML ends the tab button at the inner one. This applies the same parser rule to the Svelte tree.',
      apply(root) {
        for (const close of Array.from(root.querySelectorAll('button.ui-tabs__tab > button.ui-tabs__tab-close'))) {
          close.parentElement!.after(close)
        }
      },
    },
  ],
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
 * effects, so its HTML has them missing or at their initial value; a React
 * client render writes the same ones. They are set through style properties,
 * which style-src 'self' allows. Only the listed properties on matching
 * elements are removed, from both trees, before the CSP check and the
 * comparison — any other inline style still fails both. */
export const EFFECT_STYLES: Record<string, { selector: string; properties: string[]; reason: string }[]> = {
  DropdownMenu: [
    {
      selector: '.ui-dropdown-menu',
      properties: ['left', 'top'],
      reason: 'The menu is placed beside the measured trigger in an effect; the server HTML has 0,0 (dropdown-menu.test.ts).',
    },
  ],
  Popover: [
    {
      selector: '.ui-popover',
      properties: ['left', 'top'],
      reason: 'The panel is placed beside the measured trigger in an effect; the server HTML has 0,0 (popover.test.ts).',
    },
  ],
  Tour: [
    {
      selector: '.ui-tour__tooltip',
      properties: ['top', 'left'],
      reason: 'The tooltip is placed beside the measured target in an effect; the server HTML has 0,0 (tour.test.ts).',
    },
  ],
  TableOfContents: [
    {
      selector: '.ui-toc__indicator',
      properties: ['opacity', 'transform', 'block-size'],
      reason: 'The indicator is measured against the active link in an effect; the server HTML has only its initial opacity:0 (toc-timeline.test.ts).',
    },
  ],
  TracingBeam: [
    {
      selector: '.ui-tracing-beam--progress, .ui-tracing-beam--dot',
      properties: ['--beam-progress'],
      reason: 'Scroll progress is measured in an effect; the server HTML has its initial 0% (tracing-beam.test.ts).',
    },
  ],
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
 * React's server HTML has them missing or at their initial value; the listed
 * attributes are removed from matching elements in both trees before
 * comparison, and a behaviour test named in `reason` asserts what the effect
 * sets. */
export const EFFECT_ATTRS: Record<string, { selector: string; attributes: string[]; reason: string }[]> = {
  TreeView: [
    {
      selector: '[role="treeitem"]',
      attributes: ['tabindex'],
      reason: 'An effect makes the first item the tab stop; the server HTML has -1 on all (tree-view.test.ts).',
    },
  ],
  Popover: [
    {
      selector: '.ui-popover',
      attributes: ['data-placement'],
      reason: 'The measured position can flip the placement (jsdom\'s zero-size trigger at the top flips top to bottom); the server HTML has the requested placement (popover.test.ts).',
    },
  ],
  CommandBar: [
    {
      selector: 'dialog',
      attributes: ['open'],
      reason: 'showModal() in an effect sets `open`; the server renders the dialog without it (command-bar.test.ts).',
    },
  ],
  SortableList: [
    {
      selector: '[role="option"]',
      attributes: ['tabindex'],
      reason: 'An effect makes the first option the tab stop (roving tabindex); the server HTML has -1 on all (sortable-avatar.test.ts).',
    },
  ],
  ScrollReveal: [
    {
      selector: '.ui-scroll-reveal',
      attributes: ['data-revealed'],
      reason: 'Set on intersection, at once at motion 0 or with CSS scroll timelines, by an effect (scroll-reveal.test.ts).',
    },
  ],
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

/* Elements an effect adds after mount, from a measurement a server render
 * never makes. Matching elements are removed from both trees before
 * comparison; a behaviour test named in `reason` asserts them. */
export const EFFECT_NODES: Record<string, { selector: string; reason: string }[]> = {
  Tour: [
    {
      selector: '.ui-tour__spotlight',
      reason: 'The spotlight cut-out is measured from the target in an effect (tour.test.ts).',
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
  Carousel: [
    {
      from: 'children',
      to: 'items',
      reason:
        'React counts and wraps its children with Children.toArray. A Svelte snippet cannot be counted, so the ' +
        'Svelte component takes the array as `items` (COMPONENT-API.md rule 2, as OrbitingCircles).',
    },
  ],
  StepWizard: [
    {
      from: 'children',
      to: 'items',
      reason:
        'React indexes its children with Children.toArray to show the current step. A Svelte snippet cannot be ' +
        'indexed, so the Svelte component takes the array as `items` (COMPONENT-API.md rule 2, as OrbitingCircles).',
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
}
