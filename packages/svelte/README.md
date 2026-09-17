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

Requires `svelte@^5.29.0` (trigger snippets use attachments). No runtime dependencies.

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
  {#snippet children(props)}<button {...props}>Share</button>{/snippet}
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
- no `<style>` elements are created, with one exception inherited from React:
  TopologyGraph's SVG renderer emits its edge-dash `@keyframes` in an inline
  `<style>` at motion level 2 or above, which that policy blocks (animated
  edges then do not animate). CI allows that one file by name.

## Differences from the React package

Each exists because the React idiom has no Svelte equivalent, and each is
declared in the contract tests rather than hidden.

- **Refs are a bindable `ref` prop.** `bind:this` on a component gives the
  component instance, so every component instead takes `ref` and binds it to
  the element React's `ref` receives: usually the root, but the `<input>` or
  `<textarea>` for Checkbox, ToggleSwitch, FormInput, NumberInput,
  PasswordInput, SearchInput and Textarea, and the `<dialog>` for Dialog and
  Sheet, and the main button of a removable FilterPill (`<script>let input = $state(null)</script>
  <FormInput bind:ref={input} />`). Where React's component takes no ref, `ref`
  is still useful here: for Tooltip, NativeTooltip, Popover, DropdownMenu and
  DropdownMenuTrigger it is the element you spread the trigger props onto; for
  ConfirmDialog its dialog; for ToastProvider its container; for the other
  DropdownMenu parts, DataTableSuggestions, Tour and the two TopologyGraph
  renderers their own root or drawing surface. It is `null` while the
  component renders nothing. A test holds each case to the element React
  gives, derived from React (`tests/fixtures/refs.json`).
- **`className` is `class`.**
- **`ReactNode` props** (`icon`, `label`, `title`, `trigger`, `content`, …)
  accept a string or a snippet.
- **Form values are bindable.** `checked` (Checkbox, ToggleSwitch, Chip), `tags`
  (TagInput) and `value` on every value-holding component — FormInput,
  Textarea, PasswordInput, NumberInput, SearchInput, OtpInput, PinInput, Slider,
  SegmentedControl, RadioGroup, Combobox, Select, MultiSelect, Calendar,
  DatePicker, TimePicker, DateRangePicker, ColorInput, CodeEditor, InlineEdit,
  TransferList — support `bind:`; omit them for an uncontrolled component that
  keeps its own state (from `defaultChecked` / `defaultValue` where those
  exist). `onChange` still fires. React's strict controlled inputs — snapping
  back when a parent ignores `onChange` — are not reproduced: a component cannot
  tell a bound prop from a one-way one, and reproducing it would make `bind:`
  impossible. One consequence: FormInput's counter and clear button follow
  typing even without a `value`, where React's only read the `value` prop.
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
- **Components that inject props, count children or share state** follow
  three rules, written down in [COMPONENT-API.md](./COMPONENT-API.md): a
  trigger snippet receives the props React's `cloneElement` would add and
  spreads them (`mergeProps` chains your own handlers); a children list is
  either registered parts (AvatarGroup, TabPanel) or an `items` prop; parts
  share state through Svelte context, and `useToast()` is `getToast()`.
  DropdownMenu's composed parts render where written, so put
  `DropdownMenuContent` after `DropdownMenuTrigger`.
  Tabs finds array-API panels only through `TabPanel`; React also accepts
  any child element with a `data-tab-id` prop. As in React, a closeable tab
  nests its close button inside the tab button, and names it
  "Close [object Object]" when the label is a snippet (both inherited).
  AvatarGroup lays out its `Avatar` children only; React clones any child
  element with the group's size.
- **Server-rendered markup that the HTML parser rearranges** (inherited):
  an expanded TreeView nests a child `<li>` inside `<div>`s in its parent
  `<li>`, and a closeable Tabs tab nests a `<button>` in a `<button>`. Built
  in the browser that is fine; server HTML for it is re-parented by the
  parser, so hydration will not match. Both need a markup fix in both
  packages.
- **Render props are snippet parameters.** ContainerQuery's `children`
  receives the size, CopyButton's `children` receives `{ copied, copy }`, a
  PluginDashboard custom widget's `render` receives the data, and a
  DashboardTemplate section's `content` snippet receives its section.
- **Form context** — fields read the nearest form through
  `setFormContext(form)` / `getFormContext()`, with React's `FormState` shape.
  React's form engine itself (`createForm`, `useForm`, `Form`, `FieldArray`)
  is not ported.
- **Select**'s search box handles each key once; React's handles it twice
  (one ArrowDown moves two options).
- **Spotlight** and **CommandBar** always show a current Recent list; React's
  updates only when `items`/`actions` change identity.
- **Motion context** — `setMotionLevel(() => level)` takes a getter.
- **JsonViewer** `theme="auto"` falls back to dark where `matchMedia` is
  missing, where React would throw.

## How parity is kept honest

- Every component renders the **same full DOM tree** as its React counterpart
  — every tag, class, attribute and text node, id relationships included —
  across a set of prop cases generated from React's own server output, with the
  clock, time zone and locale pinned so the comparison is deterministic.
  State a server render cannot produce is excluded explicitly and narrowly —
  values an effect measures or writes after mount are listed per component
  with a reason (`tests/contract/divergences.ts`) and asserted by behaviour
  tests. States reached only by interaction (an open dropdown, a dragged
  crop) are covered by behaviour tests, not yet compared with React.
- That comparison collapses whitespace, because jsdom has no layout to say
  whether a space between two elements shows. `npm run check:svelte-whitespace`
  lays every case out in Chromium under the shipped stylesheet and fails on
  any visible spacing difference. It is a manual step, since CI has no
  browser.
- Every component's bindable `ref` is held to the element React's `ref`
  receives, recorded from React for every case.
- Every case is also run through axe. Accessibility defects found in the React
  package (and therefore present here) are recorded with their reason in
  `tests/contract/a11y-all.test.ts`, to be fixed in both packages together.
- The stylesheet is generated from the React package's extracted CSS — every
  component's rules are byte-identical between the two packages.
- Positioning maths is one shared framework-neutral function, not two copies;
  other framework-neutral logic (tokenizers, colour maths, dashboard configs)
  is copied from the React source by script and drift-tested, so it cannot
  diverge silently.
- Public export names map to the same React source files — checked in CI.
- CI fails if React ever appears in the shipped output.

## License

MIT
