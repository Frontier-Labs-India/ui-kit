# @frontier-labs/ui-kit-svelte

Svelte 5 components for the [`@frontier-labs/ui-kit`](https://www.npmjs.com/package/@frontier-labs/ui-kit)
design system — the same tokens, the same stylesheet, and the same class and
`data-*` contract as the React package, rendered with runes.

**0.1.0 ships 5 of the 162 Standard-tier components.** The other 157 are listed
in [`NOT_PORTED.json`](./NOT_PORTED.json); the build fails if a component is
missing from both that list and the package, so the list is the real backlog.

| Component | |
|---|---|
| `Badge` | Status indicator — variants, sizes, dot, count, removable |
| `Accordion` | Native `<details>` panels, single or multiple open |
| `Checkbox` | Bindable `checked`, indeterminate, error message |
| `Tooltip` | Hover/focus/touch, flips when off-screen |
| `Drawer` | Edge panel, portalled to `document.body`, Escape to close |

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

Each exists because the React idiom has no Svelte equivalent.

- **Refs** — use `bind:this`; there is no `forwardRef`.
- **`ReactNode` props** (`icon`, `label`, `trigger`, `content`) accept a string or a snippet.
- **Tooltip** wraps its trigger in a `display: contents` span. React attaches
  handlers to the child with `cloneElement`; Svelte cannot, so the wrapper
  carries them without adding a box.
- **Motion context** — `setMotionLevel(() => level)` takes a getter.

## How parity is kept honest

- A fixture generated from the React components asserts each Svelte component
  emits the same root class and `data-*` attributes across 17 prop combinations.
- The stylesheet is generated from the React package's extracted CSS — every
  component's rules are byte-identical between the two packages.
- Positioning maths is one shared framework-neutral function, not two copies.
- CI fails if React ever appears in the shipped output.

## License

MIT
