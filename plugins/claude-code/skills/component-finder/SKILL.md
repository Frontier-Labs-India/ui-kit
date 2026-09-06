---
name: component-finder
description: Find UI Kit components by name, feature, or use case. Use when the user asks "what component for...", "is there a...", "show me components", "find a widget", or describes UI they want to build. Covers all 162 components across Lite/Standard/Premium tiers.
---

# UI Kit Component Finder

Find the right component from @frontier-labs/ui-kit for: $ARGUMENTS

## How to Search

Use the `list_components` and `search_components` MCP tools to find components. Then use `get_component` to get full API docs.

## Quick Reference — Component Categories

**Primitives:** Button, Badge, Card, Checkbox, ColorInput, Divider, Progress, RadioGroup, Rating, Select, Slider, ToggleSwitch, Tooltip
**Forms:** FormInput, OtpInput, TagInput, SearchInput, DatePicker, TimePicker, FileUpload, Combobox, PasswordInput
**Layout:** AppShell, Navbar, Sidebar, Breadcrumbs, Tabs, Accordion, Pagination, Stepper
**Overlays:** Dialog, Drawer, Sheet, Popover, DropdownMenu, ConfirmDialog, Toast
**Data:** DataTable, SmartTable, TreeView, SortableList, InfiniteScroll, DiffViewer, JsonViewer
**Monitoring:** MetricCard, Sparkline, ThresholdGauge, UptimeTracker, UtilizationBar, TimeSeriesChart, HeatmapCalendar
**Animation:** BackgroundBeams, MeteorShower, Ripple, ShimmerButton, TextReveal, FlipWords, EncryptedText

## Weight Tiers

| Tier | Import | Best For |
|------|--------|----------|
| Lite | `@frontier-labs/ui-kit/lite` | Smallest bundle, CSS-only, no animations |
| Standard | `@frontier-labs/ui-kit` | Full features, motion, theming, a11y |
| Premium | `@frontier-labs/ui-kit/premium` | Aurora glow, spring physics, particles |

Always recommend the tier that matches the user's needs. Default to Standard.
