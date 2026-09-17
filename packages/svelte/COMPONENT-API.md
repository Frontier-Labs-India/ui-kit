# Component API conventions for React patterns Svelte cannot express

Status: decided 2026-09-17, before the nine components below were ported.
Nothing in this package is published yet, so changing an existing component's
API to match (Tooltip) costs nothing now and a major version later.

React composes components in three ways that have no Svelte equivalent:
`cloneElement` injects props into an element the caller wrote,
`Children.toArray` counts, indexes or reorders the caller's elements, and
parts of a component find each other through React context or by
`displayName`. Snippets are opaque: a component can render one, but it cannot
change its attributes, count its elements, or reorder them. So each pattern
gets one rule, applied the same way everywhere.

## Rule 1: injected props are a snippet parameter

Where React clones the caller's element to add attributes and handlers, the
Svelte component passes those props to the snippet, and the caller spreads
them onto their element:

```svelte
<Popover content="Details">
  {#snippet children(props)}
    <button {...props}>Open</button>
  {/snippet}
</Popover>
```

`props` holds exactly what React's `cloneElement` adds: `aria-*`, `title`,
event handlers. It also holds an attachment (`svelte/attachments`, Svelte
5.29+) that tells the component which element it is, for positioning, focus
return and outside-click checks. The trigger renders with no wrapper, so the
markup is React's and the contract compares it directly.

To add your own handler, merge instead of overriding. A later `onclick`
replaces the component's, and an earlier one is replaced by it:

```svelte
{#snippet children(props)}
  <button {...mergeProps(props, { onclick: track })}>Open</button>
{/snippet}
```

`mergeProps` calls the component's handler first, then yours, which is the
order React uses when it wraps a child's `onClick`.

Applies to: **NativeTooltip**, **Popover**, **DropdownMenu** (its trigger),
**DropdownMenuTrigger**, and **Tooltip**. Tooltip used to wrap its trigger in
a `display: contents` span instead. That was wrong: an element with no box
has an all-zero `getBoundingClientRect()` (confirmed in Chromium), so the
panel was positioned against the viewport origin, and its
`aria-describedby` sat on an element with no box. jsdom returns zeros for
every element, so no test could see it.

Why not a wrapper element: the wrapper would carry the ARIA state and the
handlers, not the button. It changes the DOM React renders, and, as Tooltip
showed, it gives nothing to measure.

## Rule 2: where React reads its children as a list

A snippet cannot be counted or indexed. The replacement depends on whether
React has named parts for the children.

**React has part components** (the file exports them): the part registers
itself with its parent through context when it is created, and renders
nothing in place. The parent renders the registered list itself, so it can
filter, look up by id and reorder, as React does with the child elements.

```svelte
<AvatarGroup max={3} size="sm">
  <Avatar name="Ada" />
  <Avatar name="Grace" />
</AvatarGroup>
```

Applies to: **AvatarGroup** with **Avatar** (React clones each with `size`
and renders them reversed), and **Tabs** with **TabPanel** (React finds the
panel whose `tabId` is active).

A registering parent renders `{@render children()}` before its list. Server
rendering is a single pass in template order, so a list rendered first would
be empty in SvelteKit. A server-render test covers this, because the
client-rendered contract cannot see it.

**React has no part components**: the list is a prop, `items`, whose
entries are what the children would have been: snippets, strings or numbers.
The component renders them itself, so it can count and index them. This is
what OrbitingCircles has done since batch 2.

```svelte
{#snippet account()}<AccountForm />{/snippet}
{#snippet review()}<Review />{/snippet}
<StepWizard {steps} items={[account, review]} />

{#snippet second()}<img src="/b.png" alt="Second" />{/snippet}
{#snippet third()}<img src="/c.png" alt="Third" />{/snippet}
<Carousel items={['First slide', second, third]} />
```

Applies to: **StepWizard** (React renders `children[activeStep]`) and
**Carousel** (React counts and wraps each child). Inventing part components
(`CarouselSlide`) would add public names React does not have, which the parity
gate refuses.

## Rule 3: parts that share state use Svelte context

Where parts find their parent through React context, they do the same through
Svelte's `setContext`/`getContext`, under the same exported names. The parts
render in place, in the order the caller writes them, as in React.

- **Tabs** composed API: `TabList`, `TabTrigger`, `TabContent`.
- **DropdownMenu** composed API: `DropdownMenuTrigger` (Rule 1 for its
  element), `DropdownMenuContent`, `DropdownMenuItem`,
  `DropdownMenuSeparator`, `DropdownMenuLabel`.
- **ToastProvider**: React's `useToast()` hook becomes `getToast()`, called
  during component initialisation, like `getFormContext()`. It throws outside
  a provider, as React's does.

## Not a convention case

**TreeView** was on this list by mistake: every `children` in its source is
`node.children`, tree data. It is ported like any other component.

## Contract testing

- A case's `{ $el: 'x' }` renders `<b>x</b>` in React. On the Svelte side it
  is a snippet that accepts an optional props parameter and applies it to that
  `<b>`: attributes, listeners and attachments. So Rule 1 triggers compare the
  exact attributes React's `cloneElement` adds.
- Rule 2 `items`: a `PROP_RENAMES` entry (`children` → `items`), as for
  OrbitingCircles. Each `{ $el }` in the array becomes a snippet.
- Rule 2 and Rule 3 parts: a case encodes a part tree (`{ $part: 'TabPanel',
  props, children }`). React builds it with `createElement`. Svelte renders it
  through one recursive test component, so the markup callers actually write is
  what gets compared.
- Open states (menus, popovers) stay behaviour-tested, like every other
  interaction state.
