# @frontier-labs/ui-kit-svelte

Svelte 5 components for the [`@frontier-labs/ui-kit`](https://www.npmjs.com/package/@frontier-labs/ui-kit)
design system — the same tokens, the same stylesheet, and the same class and
`data-*` contract as the React package, rendered with runes.

**Not every React component is ported yet.** The ones still to come are listed
in [`NOT_PORTED.json`](./NOT_PORTED.json); the build fails if a component is
missing from both that list and the package, so that file is the real backlog
and this README does not repeat a count that would go stale. Everything
exported from the package is ported and contract-tested against React.

## Install

```bash
npm install @frontier-labs/ui-kit-svelte
```

Requires `svelte@^5`. No runtime dependencies.

## Use

```svelte
<script>
  import { Badge, Checkbox, Tooltip } from '@frontier-labs/ui-kit-svelte'
  import '@frontier-labs/ui-kit-svelte/css'
  import '@frontier-labs/ui-kit-svelte/theme'   // optional design tokens

  let accepted = $state(false)
</script>

<Badge variant="success" dot>Deployed</Badge>

<Checkbox label="I accept" bind:checked={accepted} />

<Tooltip content="Copies the link">
  <button>Share</button>
</Tooltip>
```

**The stylesheet import is required.** The package does not inject styles at
runtime. Every component has fallback values for its tokens, so `theme` is
optional.

## Content Security Policy

Built to run under `style-src 'self'` with no `unsafe-inline`:

- no `style="…"` attributes and no `style:` directives — both are checked in CI.
  Svelte applies a `style:` directive's first value through `cssText`, which
  that policy blocks, so it would be silently dead on first paint;
- dynamic values (Tooltip's position) are written with `style.setProperty`,
  which CSP permits, through the exported `cssProps` action;
- no `<style>` elements are created.

## Differences from the React package

Each exists because the React idiom has no Svelte equivalent, and each is
declared in the contract tests rather than hidden.

- **Refs** — use `bind:this`; there is no `forwardRef`.
- **`className` is `class`.**
- **`ReactNode` props** (`icon`, `label`, `title`, `trigger`, `content`, …)
  accept a string or a snippet.
- **Form values are bindable.** `checked` (Checkbox, ToggleSwitch, Chip),
  `value` (PinInput, Slider) and `tags` (TagInput) support `bind:`; omit them
  for an uncontrolled component that keeps its own state (from
  `defaultChecked` / `defaultValue` where those exist). `onChange` still
  fires. React's strict controlled inputs — snapping back when a parent ignores
  `onChange` — are not reproduced: a component cannot tell a bound prop from a
  one-way one, and reproducing it would make `bind:` impossible.
- **`style` accepts a CSS string or a React-style object**, and is applied
  through `setProperty` — so a caller's own style is CSP-safe too. Objects
  follow React's rules, including `px` on numbers except unitless properties.
- **DOM handlers are lowercase** (`onclick`, `onmouseenter`); named callback
  props keep their React names (`onChange`, `onDismiss`, `onNodeClick`).
- **`as`** (Typography, Card) takes a tag name; React also accepts a component.
- **TextHighlight** takes its searchable text as `text` — a snippet's text cannot
  be read back, which React's `children: string` relies on. (As in React,
  `Highlight` is the hero-section span and the text highlighter is `TextHighlight`.)
- **OrbitingCircles** takes `items: []` — a snippet cannot be split into children.
- **Tooltip** wraps its trigger in a `display: contents` span. React attaches
  handlers to the child with `cloneElement`; Svelte cannot, so the wrapper
  carries them without adding a box.
- **Motion context** — `setMotionLevel(() => level)` takes a getter.
- **JsonViewer** `theme="auto"` falls back to dark where `matchMedia` is
  missing, where React would throw.

## How parity is kept honest

- Every component renders the **same full DOM tree** as its React counterpart
  — every tag, class, attribute and text node, id relationships included —
  across a set of prop cases generated from React's own server output, with the
  clock, time zone and locale pinned so the comparison is deterministic.
- Every case is also run through axe. Accessibility defects found in the React
  package (and therefore present here) are recorded with their reason in
  `tests/contract/a11y-all.test.ts`, to be fixed in both packages together.
- The stylesheet is generated from the React package's extracted CSS — every
  component's rules are byte-identical between the two packages.
- Positioning maths is one shared framework-neutral function, not two copies.
- CI fails if React ever appears in the shipped output.

## License

MIT
