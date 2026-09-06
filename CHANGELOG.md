# Changelog

All notable changes to this project will be documented in this file.

This changelog is auto-generated from [conventional commits](https://www.conventionalcommits.org/).

## Unreleased (2026-09-06)

### ⚠ BREAKING CHANGES

- rebrand source, docs, demo and editor plugins to Frontier Labs (`739aee1`)
- rename to @frontier-labs/ui-kit, v3.0.0 (`8bcc949`)

### Features

- rebrand source, docs, demo and editor plugins to Frontier Labs (`739aee1`)
- rename to @frontier-labs/ui-kit, v3.0.0 (`8bcc949`)

### Bug Fixes

- the MCP SSE server could not start from its own bundle (`55b5415`)
- the worker registry was a hand-copy, five months stale (`4ef1fa7`)
- JSR version desync root cause + fail-loud guard + CI concurrency (`8ca93dc`)

### Documentation

- security policy, code of conduct and contributor invariants (`b68b3f3`)
- document the self-hosted MCP endpoint, mark the Worker unsupported (`96bc23a`)

### Tests

- gate component counts against build output (`1d6584b`)

### CI

- point trusted publishing at the @frontier-labs scope (`dfcbb1f`)

## 2.9.0 (2026-06-07)

### Features

- lite tier self-injects scoped CSS — fully styled on import, no CSS wiring (`9657b8d`)
- ship all documented APIs — theme utils, perf hooks, AI generator, motion exports (`a8f0ffd`)
- MCP get_adaptive_info tool + adaptive notes in all responses (`1e29abf`)
- adaptive tier is now DEFAULT + CSS layer + dev debug overlay (`41746dc`)
- standalone adaptive test page — 12KB, loads on GPRS in 2s (`1030d6e`)
- tier structural parity audit script (`666094d`)
- adaptive tier rendering MVP — auto-detect bandwidth, adjust motion (`b15f605`)

### Bug Fixes

- bugs surfaced by full visual sweep across all 148 components × 3 tiers (`4affdf3`)
- adaptive detection is instant — probe runs in background (`1eb45dc`)
- adaptive detection uses latency probe instead of bandwidth measurement (`0723178`)
- adaptive detection uses real speed probe — works with DevTools throttling (`0e9c025`)
- recalibrate adaptive tier detection — much more generous thresholds (`b0bdb7f`)
- 159/159 components achieve structural parity across all tiers (`ae28300`)
- add root wrangler.toml for Cloudflare deployment (`84128d1`)
- sync Cloudflare worker with 8 MCP tools + design guide (`4ff62e9`)

### Documentation

- adaptive tier implementation plan — 10 tasks (`2a60095`)
- updated adaptive tier spec — all phases approved (`668bf80`)
- adaptive tier rendering design spec (`1f382ca`)
- add SSR guide to Getting Started + MCP SSR safety note (`c62fb24`)
- update README, Getting Started guide, MCP docs for v2.8.x (`26836e4`)

## 2.8.1 (2026-04-05)

### Features

- add design guide to MCP responses for world-class output (`bd863f9`)
- Issue #17 — MCP get_page_template tool for complete page scaffolds (`8c56999`)

### Bug Fixes

- Issue #16 — spacing & padding revamp across all components (`fed5595`)

### Chores

- v2.8.1 — spacing revamp, design guide, MCP page templates (`775936a`)
- update Cloudflare worker registry to v2.8.0 (`d9764e4`)

## 2.8.0 (2026-04-05)

### Features

- ListLayoutPage demo + MCP novice user enhancements (`8f996cf`)
- Issue #14 — page layout primitives (6/7 demo pages) (`18e9767`)
- add lite/premium wrappers for NativeTooltip (`74f9b99`)
- PLAN-110 + automated audit script for 110/110 target (`11afa4b`)
- prop/tier drift detection script (`d345ee8`)
- single source of truth — extract-component-meta.ts (`0fc5f59`)
- tier support on 26 pages + quality audit framework (`ab7f4a6`)
- split AI Plugins page, fix navigation bug, optimize Home performance (`9eb43fb`)

### Bug Fixes

- update tests for v2.8.0 — MCP 7 tools, lite class name (`dddec30`)
- add missing layout component source files (`3cb1535`)
- Issue #15 — CSS import DX prevents silent styling failure (`e5a5479`)
- final 3 pages to 110/110 — ALL 152 pages now perfect (`ca116dc`)
- P3 — rebuild 25 stub pages to 110/110 (151/152 complete) (`ea98abf`)
- P1 batch 2 — 114 component pages to 110/110 audit score (`07b244a`)
- P1 batch 1 — 13 core pages to 110/110 (`9c0cb96`)
- Tier 2 audit — Rating(61), SearchInput(59), DatePicker(67), InlineEdit(74) (`50ed8d9`)
- Tier 2 audit — RadioGroup(75), FormInput(81), ComboBox(81), ColorInput(72), OtpInput(66) (`21bbd31`)
- critical bugs — FileUpload URL leak, Slider NaN, maxFiles logic (`b713a10`)
- Tier 1 audit — Button(86), Card(84), Badge(83), Dialog(88) + in-progress audits (`4a8ed7a`)

### Chores

- bump version to v2.8.0 (`259cead`)

## 2.7.3 (2026-04-04)

### Features

- AI Plugins showcase — assistant setup cards, skill demos, use case gallery (`157cf57`)
- update MCP page with AI integrations, hosted URL, plugin features (`5bb959d`)

### Bug Fixes

- inject 'use client' into all build chunks, not just entry points (`7719396`)
- comprehensive SSR audit + last 2 demo pages (closes #13) (`299f0e9`)
- GitHub Pages SPA routing — add 404.html redirect (`bdaa174`)

### Documentation

- Claude plugin submission guide with 7 use cases + Dockerfile for Glama (`c4c5ddf`)
- marketplace submission tracker and status (`8630bd0`)

## 2.7.2 (2026-04-04)

### Features

- Tabs + DropdownMenu composed children API, Next.js docs (closes #10, #11, #12) (`7e6de6e`)
- AI integrations — Claude Code, Cursor, VS Code, Windsurf, Codex (`67444cf`)
- Claude Code plugin — skills, agents, hooks, hosted MCP (`b882d83`)
- hosted MCP — update README, demo homepage, Worker landing page (`df8e83d`)
- Cloudflare Worker for hosted MCP server (`c22afb2`)

### Bug Fixes

- add explicit return types to 162 exported functions (JSR slow types) (`12608fe`)

### Chores

- deduplicate CI workflows + fix 4 slow types + keep --allow-slow-types (`7021b46`)

## 2.7.1 (2026-04-04)

### Features

- add global MCP error handlers at entry point (closes #6) (`e947235`)
- enhance VlanBusBar, DashboardTemplate, PluginDashboard (`b6d4137`)
- 7 netrak infrastructure components + graph engine + TimeSeriesChart enhancements (`ae174b2`)
- **lite:** add missing props to remaining 21 Lite wrappers (`88b3421`)
- **lite:** add missing props to Button, Badge, Card, Checkbox, Divider, FormInput, Progress, Skeleton, ToggleSwitch, Slider (`6a516c4`)
- **lite:** add missing props to Select, Combobox, Dialog, ConfirmDialog, Drawer, DropdownMenu, Sheet, Tabs, Sidebar, Navbar (`537daa9`)
- AI-native GTM — MCP server polish, CLI setup, demo improvements (`bea2297`)

### Bug Fixes

- SSR hydration — deterministic CSS IDs via content hash (fixes #9) (`40fe549`)
- topology/pipeline rendering, NIG grid layout, chart tooltip portal (`dd8229b`)
- TimeSeriesChart tooltip clamped to chart bounds, JsonViewer tier cards clickable (`be5e9f5`)
- TimeSeriesChart tooltip uses imperative viewport-clamped positioning (`5ef8ae2`)
- MetricCard restore min-inline-size:160px, fix playground wrapper width (`752be08`)
- AnimatedCounter formatters, CopyBlock java/csharp/php/swift/kotlin, TimeSeriesChart fixed tooltip (`dece34f`)
- Sparkline tooltip positioning, CoreChart randomize button (`0bb0c9f`)
- Progress Lite severity colors, ThresholdGauge text overlap (`25ddcfe`)
- CopyBlock languages, NumberTicker visibility, MetricCard overflow, TimeSeriesChart tooltip (`371cf02`)
- update Lite tests for new wrapper structures + fix Skeleton/Checkbox/ToggleSwitch (`808554c`)
- resolve TS errors in tier comparison sections (`0730d6e`)
- add missing props to Lite tier wrappers for full API parity (`457e75b`)
- Figma dropdown styling, Home card deep links, Embed preview (`1f6bb5d`)
- mobile polish — icons toolbar, perf stats grid, code overflow (`22e455e`)
- mobile responsiveness + performance optimizations (`78512e8`)

### Documentation

- add Cursor MCP setup guide (from PR #7 by @SahilKumar75) (`2cdaea3`)
- update README — correct bundle size, premium count, add Cursor guide link (`1aa2a81`)
- update utility pages and verify accuracy (`9f67183`)
- update remaining 15 component pages to match source-of-truth (`3553b3c`)
- update component pages PropsTable to match source-of-truth (batch 1) (`5bc79a1`)
- update Infrastructure & Monitoring pages to match source-of-truth (`5c5bc0b`)
- update Monitoring Additional pages to match source-of-truth (`6dcd874`)
- update remaining component pages to match source-of-truth (`27f2330`)
- update Data Visualization pages to match source-of-truth (`309fb64`)
- update Magic Effects pages to match source-of-truth (`2ffd77e`)
- update Text & Code display pages to match source-of-truth (`f282edc`)
- update Navigation pages to match source-of-truth (`f25127d`)
- update Data Tables & Trees pages to match source-of-truth (`a179d3e`)
- update Content display pages to match source-of-truth (`95fbae1`)
- update Overlay pages to match source-of-truth (`de565d2`)
- update Spotlight, CommandBar & Tour pages to match source-of-truth (`f2f0463`)
- update Badge & Status display pages to match source-of-truth (`aa16cda`)
- update Form Input (text/selection) pages to match source-of-truth (`6097447`)
- update Form Controls pages to match source-of-truth (`efdce95`)
- update specialized Form Input pages to match source-of-truth (`51366fa`)
- update Actions & Buttons pages to match source-of-truth (`1e37981`)

### Performance

- **styles:** batch adoptedStyleSheets mutations, memoize css tag (`4d8c9da`)

### Refactoring

- **lite:** convert 38 Lite wrappers to proxy pattern for full API parity (`710497e`)

### Chores

- improve JSR score — description, module docs, exports, compat (`7711267`)
- bump bundle budget to 400KB for netrak infrastructure components (`335c1f6`)

### Tests

- add comprehensive prop coverage for Card, Alert, Badge, Select (`8800489`)

## 2.7.0 (2026-03-29)

### Features

- **v2:** Showcase ALL hidden features across 10 component demo pages (`0788930`)
- **v2:** AI DataTable suggestions + RSC support + Web Components wrapper (`2b0248a`)
- **v2:** 7 improvements — Storybook, embeds, search, shortcuts, polish (`53ccf8c`)

### Bug Fixes

- **v2:** Generator mobile overflow + tier visual effects on preview (`634a66a`)
- **v2:** Tier Comparison — real component rendering + different sizes per tier (`90479cd`)
- **v2:** Select trigger visible in light mode + Figma page dropdown (`262c970`)
- **v2:** Theme Playground respects site light/dark mode (`20db239`)

### Chores

- bump to v2.7.0 — AI DataTable, RSC, Web Components, feature showcase (`c6939f9`)

## 2.6.0 (2026-03-28)

### Features

- **v2:** Complete polish — tests, CI, docs, community, new pages (`b3ddbf7`)

### Bug Fixes

- exclude visual tests from tsconfig (Playwright types not in main build) (`2349771`)
- Publish workflow — full git history for changelog + resilience (`887a508`)
- CI failures — a11y script + storybook build resilience (`a0e7ea9`)

### Chores

- bump to v2.6.0 (`c9e6381`)

## 2.5.1 (2026-03-28)

### Chores

- bump to v2.5.1 — test npm publish with token (`1b2b40b`)

## 2.5.0 (2026-03-28)

### Features

- **v2:** 31 missing Storybook stories — 147/147 components covered (`52356e6`)
- **v2:** All 147 components fully interactive in Generator (`4ab32f4`)
- **v2:** Generator overhaul — grid layout, 147 component previews, drag-drop columns (`fb303f1`)
- **v2:** MCP demo + Figma GUI + drag-and-drop + full component DB (`49b1ae9`)
- **v2:** Next-Gen Features showcase on landing page (`8d0fe5a`)
- **v2:** Phase 6 — Documentation, fixes, v2.5.0 prep (`4277139`)
- **v2:** Phase 5 — Scroll choreography, demo page, CI bundle tracking (`d555924`)
- **v2:** Phase 4 — AI Component Generator (`7d6fccb`)
- **v2:** Phase 3 — CLI scaffolding + Figma plugin + Style Dictionary (`e19edba`)
- **v2:** Phase 2 — Theme Editor utils, Performance Dashboard, View Transitions (`a9c4206`)
- **v2:** Phase 1 — Choreography engine, Container Queries, View Transitions (`553f36e`)
- Add MCP server for AI assistant integration (`9644e09`)
- **v2:** Shared premium effects — all 114 premium components now have aurora glow, spring entrance, shimmer sweep, and particle burst (`f4d3eff`)

### Bug Fixes

- **v2:** MCP list layout + Figma toggle + component spacing (`a31a375`)
- **v2:** Feature card links + render profiler infinite loop (3rd fix) (`92cc6e4`)
- **v2:** Performance page — render profiler samples 3s then stops + explanations (`1b4946d`)
- **v2:** Critical navigation bug + docs tabs + icons + render loop (`f84e95c`)
- **v2:** Generator + Performance pages — full light mode fix + real components (`93c04f3`)
- **v2:** Visual audit fixes — light mode for Choreography + Generator pages (`1d81379`)
- **v2:** Landing page cards now visible instantly — removed opacity:0 (`034478b`)
- **v2:** Post-merge fixes — Select light mode, bundle budget, MCP tsconfig (`9654746`)
- **v2:** Dropdown components — light mode backgrounds + overflow visible (`69b3f81`)
- **v2:** Add pulse animations to severity-timeline dots + step-wizard active (`10ec26f`)
- **v2:** min-inline-size added to 25 more components — all audited (`5f48bed`)
- **v2:** Add min-inline-size to 11 components to prevent compression (`163542b`)
- **v2:** EntityCard status dot now pulses in standard + premium (`a89f7c4`)
- **v2:** EntityCard — larger preview, stronger borders, min-width (`ffeec20`)

### Documentation

- **v2:** Complete post-merge update — landing page, README, docs (`2017d31`)

### Performance

- **v2:** Landing page — all imports eager, zero lazy loading (`9437341`)

## 2.4.1 (2026-03-27)

### Bug Fixes

- **v2:** 4 broken demo pages + npm publish workflow (`ba15a98`)
- **v2:** Playground overflow — all 111 demo pages fixed globally (`d15b02f`)

### Chores

- bump to v2.4.1 (`e25d0fe`)

## 2.4.0 (2026-03-27)

### Features

- **v2:** 5 new netrak components + full documentation update (`93a6fac`)
- **v2:** 9 stories + 9 tests for netrak infrastructure components (`ce98646`)
- **v2:** 9 new demo pages + routes + sidebar for netrak components (`9d1e6f1`)
- **v2:** 9 new netrak-inspired infrastructure components (`c71ba6d`)
- **v2:** Phase 4 — 39 new Storybook stories + light mode color fixes (`e9d6347`)
- **v2:** Phase 3 — 55 new premium domain components (100 total premium) (`6592ec9`)
- **v2:** Phase 2 — 31 new premium standard components (`0b3a6c2`)
- **v2:** Phase 1 — 22 new lite domain components + 3 new test files (`c358e13`)
- **v2:** New components — Typography, Kbd, Link (`972f1ca`)
- **v2:** New components — Typography, Kbd, Link (`2b95155`)
- **v2:** Tier-reactive sidebar with glass morphism + visual polish (`ccdc12e`)
- **v2:** Sidebar + landing page revamp — dogfooding components, micro-interactions, fixes (`edd5332`)
- **v2:** Complete demo site revamp — landing page, navigation, CI fix, tiered UpstreamDashboard (`15e0eba`)
- **v2:** 78 new component demo pages + full route/sidebar wiring + component fixes (`94d912e`)
- **v2:** Redesigned landing page + component sidebar navigation (`52e1675`)
- **v2:** 7 new premium components + all demo pages updated for real 3-tier support (`5962e02`)
- **v2:** AlertPage/DrawerPage premium tiers + MetricCardPage weight tiers (`9c17479`)
- **v2:** MetricCard status glow + pulsing dot, premium Alert/Drawer, Drawer portal (`bc61bad`)
- **v2:** TooltipPage, ProgressPage, CheckboxPage, ToggleSwitchPage (`707a19e`)
- **v2:** TabsPage, AccordionPage, AlertPage, DrawerPage + Select click-outside fix (`ac1f8ce`)
- **v2:** SelectPage + MetricCardPage — full rebuilds following ButtonPage pattern (`747f5e0`)
- **v2:** DialogPage — full rebuild following ButtonPage pattern (`c83f67b`)
- **v2:** BadgePage — full rebuild following ButtonPage pattern (`d54d06f`)
- **v2:** UpstreamDashboard hero — split Rx/Tx utilization bars, capacity/burst/total in footer (`caa93ce`)
- **v2:** UpstreamDashboard — responsive scaling (smartwatch to video wall), clickable cards/groups/rows, fluid cqw metrics (`9159571`)
- **v2:** UpstreamDashboard — nested group cards, utilization bars with burst markers, mini cards with full details (`03e612e`)
- **v2:** UpstreamDashboard — side-by-side metrics, utilization modes, burst capacity, ambient coloring, data format docs (`efb629f`)
- **v2:** UpstreamDashboard rewrite — hero/compact/table modes, metrics-dominant design, trendline background (`dc9918b`)
- **v2:** UpstreamDashboard demo page — JSON-driven NOC dashboard showcase (`07114e7`)
- **v2:** UpstreamDashboard — JSON-driven nested NOC dashboard with unit-aware traffic metrics (`48a971e`)
- **v2:** DataTablePage enterprise showcase + budget increase to 200KB (`9176869`)
- **v2:** DataTablePage — enterprise showcase with virtual scroll, filters, grouping, editing (`e5fcd32`)
- **v2:** DataTable enterprise — virtual scroll, per-column filters, grouping, cell editing, server-side, auto-size, pinned columns (`5b74af0`)
- **v2:** Card compositions — massive metrics, superimposed trendlines, fluid clamp sizing (`2152ca1`)
- **v2:** CardPage — rich compositions: photo cards, metric cards, trendline cards, profile cards (`2eff98a`)
- **v2:** Card — click-anywhere expand, comprehensive playground, effects section (`1afaab7`)
- **v2:** CardPage — fix tier shrinking, add glass/gradient/header/footer/expandable/composition demos (`501df2a`)
- **v2:** CardPage complete redesign — matches ButtonPage pattern, 5 framework tabs, tier-aware (`05447c1`)
- **v2:** haptic toggle in playground — enable/disable + pattern selector (light/medium/heavy/success/error) (`41ce9d1`)
- **v2:** Button — haptic feedback, keyboard shortcuts, scroll reveal animations (`948d855`)
- **v2:** unified weight tiers, global tier switch in sidebar, better card contrast and spacing (`a46368e`)
- **v2:** ButtonPage complete redesign — animated aurora hero, staggered reveal, intuitive layout (`c325285`)
- **v2:** ButtonPage — weight tier selector, HTML+CSS export, color customization, animation styles (`fd73271`)
- **v2:** dedicated Card + Badge pages — interactive playground, all variants/sizes/tiers (`6b9b53c`)
- **v2:** MetricCardPage — interactive docs for MetricCard component (`601652d`)
- **v2:** DataTablePage — interactive docs for DataTable component (`771f6c6`)
- **v2:** add Select and Dialog routes to demo (`a19b369`)
- **v2:** DialogPage — interactive docs for Dialog component (`950095e`)
- **v2:** SelectPage — interactive docs for Select component (`f5ac34e`)
- **v2:** dedicated Button page — interactive playground, all variants/sizes/states/tiers (`364cbd9`)
- **v2:** GeoMap — geographic visualization with SVG world map, points, connections (`b41b5b8`)
- **v2:** DashboardGrid — nested groupable auto-adaptive card container (`8e85f56`)
- **v2:** NetworkTrafficCard — unit-aware traffic visualization with animated icons (`fd2c37b`)
- **v2:** OverlaysPage, DataPage, MonitorPage, AIPage — key components as interactive docs (`b8632a0`)

### Bug Fixes

- Publish workflow — trusted publishing for npm + JSR via OIDC (`54af9b8`)
- **v2:** ConnectionTestPanel crash, MetricCard visibility, page backgrounds (`4bccd50`)
- **v2:** Landing page stats show 111 components, 109 premium (`867c782`)
- **v2:** Comprehensive demo page audit — premium tiers + overflow clipping (`c228073`)
- **v2:** Gallery cards now visible — removed LazySection, critical gallery CSS (`0832861`)
- Update CI/CD workflows and docs for main branch (v2 → main) (`f815274`)
- **v2:** Landing page preview strip — visible components in both modes (`ea00ba1`)
- **v2:** Demo page + sidebar light mode — dark backgrounds replaced (`3b78b10`)
- **v2:** Final light mode pass — 16 component files + 10 demo pages (`c1aaeb6`)
- **v2:** Comprehensive light mode fix — central CSS variables + 29 component files (`bd17f2e`)
- **v2:** Theme toggle, pipeline scroll, realtime value animation, TS fixes (`b1a5627`)
- **v2:** Landing page shows correct premium count (100), docs accuracy (`d95ae8c`)
- **v2:** Phase 5+6 — Docs update + bundle budget adjustment (`d802960`)
- **v2:** Add missing MetricCardPage route to main.tsx (`a68ca23`)
- **v2:** Theme persistence, site-wide tier propagation, light mode fixes, docs update (`d63e585`)
- **v2:** Checkbox centering, ToggleSwitch thumb overflow, MetricCard page rebuild (`1f31ae9`)
- **v2:** AccordionPage — all features in playground, tier differences visible (`df4e697`)
- **v2:** Select dropdown positioning + premium tier card on SelectPage (`2ce458d`)
- **v2:** Dialog — all structural CSS unlayered, sizes + layout can't be beaten by UA (`93025fe`)
- **v2:** Dialog — move visual styles outside @layer to beat UA defaults (`55c25f6`)
- **v2:** Dialog mobile — center in viewport instead of bottom sheet (`e9c9f88`)
- **v2:** Dialog centering — unlayered CSS beats UA stylesheet, mobile bottom sheet (`5a08faf`)
- **v2:** Dialog — center viewport, scrollable body, next-gen visuals (`aae9830`)
- **v2:** UpstreamDashboard — table scroll, label wrapping, consistent summary metrics in all modes (`93acb3a`)
- **v2:** UpstreamDashboard mini cards — compact 2-line layout, metrics inline with label, utilization bar + capacity at end (`4b41b3f`)
- **v2:** region filter alignment — checkbox items left-aligned with proper spacing (`467c580`)
- **v2:** DataTable filter popover — React portal + separate CSS for mobile bottom sheet (`e4a3a64`)
- **v2:** DataTable filter — backdrop overlay instead of document listener (`56e7b02`)
- **v2:** DataTable filter — works on mobile (touch), bottom sheet on small screens (`a9fd282`)
- **v2:** DataTable filter popover visibility + th positioning + overflow fix (`93f448f`)
- **v2:** Card playground — wrapper div constrains width, premium card no longer shrinks (`92d26fe`)
- **v2:** Card visibility + premium shrinking + glass backdrop (`59d23b8`)
- **v2:** HTML+CSS code export now tier-aware — class name and CSS import change per weight tier (`6fb2e32`)
- **v2:** Vue/Angular/Svelte code generators are now tier-aware (`1eb32f4`)
- **v2:** playground reads tier from both prop and context for reliable updates (`c9c9c43`)
- **v2:** playground copy matches active tab, added Angular + Svelte tabs (`593466a`)
- **v2:** keyboard shortcut demo uses Toast instead of native alert (`bc06c39`)
- **v2:** haptics — return boolean from haptic(), add requirements note in demo (`571a534`)
- **v2:** brand color in separate card, removed duplicate code export, cleaner section flow (`08cd71b`)
- **v2:** weight tier cards overflow — min-width:0 on grid items, import text wraps (`fd3167e`)
- **v2:** ButtonPage — section gaps, honest size breakdown, no popover clipping (`3678703`)
- **v2:** ButtonPage — real bundle sizes, dynamic estimation, card sections, centered layout (`2a6e20c`)
- **v2:** card-wrapped sections, adaptive centering, minimalist scrollbar, code overflow (`e02aeef`)
- **v2:** centered layout, ColorInput click-outside-close, mobile popover, spacing polish (`c36043c`)
- **v2:** ButtonPage — brand-only theme override, lite CSS imported in demo (`a5334d4`)
- **v2:** ButtonPage — use ColorInput component, mode-aware theme generation, better spacing (`b5ef335`)
- **v2:** ButtonPage responsive + OKLCH tokens — works from mobile to video wall (`c18b4b8`)
- **v2:** Button page — proper color system with full theme generation (`7743a1c`)
- **v2:** Button — pixel-perfect micro-interactions, no visual artifacts (`bc6fe0d`)
- **v2:** lite Button CSS — pixel-perfect to match standard, hover/active/focus polish (`9f6e328`)

### Documentation

- **v2:** Complete documentation rewrite + accurate landing page gallery (`3b39637`)
- **v2:** Update component counts and add netrak-inspired components to docs (`7f11ce7`)

### Performance

- **v2:** Critical hero CSS in index.css — instant first paint (`286609f`)
- **v2:** Landing page virtualized rendering — instant hero, lazy sections (`0b62947`)

### Chores

- bump version to 2.4.0 (`a3975a1`)

### Styles

- **v2:** ButtonPage — generous spacing, aligned headings, breathing room between sections (`60549c5`)
- **v2:** ButtonPage visual overhaul — aurora glow, gradient title, dot grid, scroll reveal (`fd70130`)

## 2.3.0 (2026-03-21)

### Features

- **v2:** FormsPage rebuilt as interactive documentation (`3fa369f`)
- **v2:** Theme Playground — interactive brand color picker with live preview and export (`8bde8c3`)
- **v2:** CorePage rebuilt as interactive documentation with ComponentShowcase (`4e880bd`)

### Chores

- bump version to 2.3.0 (`4d8477b`)

## 2.2.0 (2026-03-21)

### Features

- **v2:** lite tier expanded — ALL components in CSS-only/minimal-JS versions (`0f5495c`)
- **v2:** 10 Aceternity-style visual effect components (`2bb0891`)
- **v2:** premium tier — 5 enhanced components with 3D tilt, ripple, particles, spring entrance (`eb00258`)
- **v2:** PropsTable + ComponentShowcase — interactive documentation components (`84b5cb0`)
- **v2:** lite tier — 10 CSS-only components, <3KB total bundle (`cf097f9`)

### Bug Fixes

- **v2:** typecheck fix for lite test (`626a4c6`)

### Documentation

- **v2:** elevation plan — weight tiers, effects, interactive docs, theme playground (`b893341`)

### Chores

- bump version to 2.2.0 (`9420d36`)
- increase bundle budget to 160KB for 85+ components (`41199e0`)

## 2.1.0 (2026-03-21)

### Features

- **v2:** DataTable demo with all features + xs/xl sizes + 10 themes + 8 showcase components (`e09eba2`)
- **v2:** export all 8 showcase components from domain barrel (`49d6120`)
- **v2:** Ripple — Material Design-style click ripple effect (`5f82c55`)
- **v2:** NumberTicker — slot-machine style digit rolling counter (`7b0c63b`)
- **v2:** OrbitingCircles — elements orbiting around a central point (`b3edb5a`)
- **v2:** TextReveal — character-by-character text reveal animation (`56b0f5f`)
- **v2:** GlowCard — mouse-tracking radial glow card effect (`9e5083d`)
- **v2:** MeteorShower — animated shooting stars background effect (`8e61b92`)
- **v2:** BorderBeam — glowing beam traveling around container border (`27aa813`)
- **v2:** ShimmerButton — animated shimmer gradient border button (`d44f810`)
- **v2:** 10 named themes — aurora, sunset, rose, amber, ocean, emerald, cyan, violet, fuchsia, slate (`3880628`)
- **v2:** add xs/xl sizes to all components — 5 size variants like DaisyUI (`633471d`)
- **v2:** premium Home page — hero, live dashboard, features, code example (`8030496`)
- **v2:** advanced animations — entrance hook, skeleton morphing, scrollScene, micro-interactions (`b3eb84d`)
- **v2:** add Alert, SearchInput, Rating, OtpInput, TagInput, DatePicker to barrel (`48ac908`)
- **v2:** DatePicker — calendar popover with keyboard nav, min/max, locale (`4333fef`)
- **v2:** TagInput — pill tags with Enter/comma/Tab, validation, max limit (`20cee15`)
- **v2:** OtpInput — auto-advance digit boxes with paste, backspace, shake (`ecc39eb`)
- **v2:** Rating — star rating with hover preview, half-star, keyboard nav (`dd951f7`)
- **v2:** SearchInput — debounced search with loading, clear, Enter trigger (`053ea36`)
- **v2:** Alert — variant-aware banner with dismiss, action, auto-icons (`1bc6367`)

### Chores

- bump version to 2.1.0 (`7e1e883`)

## 2.0.4 (2026-03-21)

### Features

- **v2:** demo site rebuilt — cohesive layout, animations page, icons gallery (`c6132fe`)

### Bug Fixes

- **v2:** toggle click, tap highlight, slider focus, table features, sortable touch, copy fallback, infinite scroll demo (`95b1552`)

### Chores

- bump version to 2.0.4 (`900c214`)

## 2.0.3 (2026-03-20)

### Bug Fixes

- **v2:** component quality — mobile sizing, toggle state, radio clicks, counter smoothness, select multiselect, dropdown theme (`3cbc511`)

### Chores

- bump version to 2.0.3 (`4d49377`)

## 2.0.2 (2026-03-20)

### Bug Fixes

- **v2:** JSR publish — use --allow-slow-types instead of --no-check (`ceb0278`)

### Chores

- bump version to 2.0.2 (`fd049f7`)

## 2.0.1 (2026-03-20)

### Features

- **v2:** demo uses AppShell, Sidebar, Navbar, Drawer — eating our own dog food (`3c6ec9c`)
- **v2:** AppShell — layout orchestrator, grid layout, responsive (`ea59b95`)
- **v2:** Drawer — slide-in panel, all sides, non-modal (`424033c`)
- **v2:** Navbar — sticky header, responsive collapse, backdrop blur (`9c1bbb2`)
- **v2:** Sidebar — collapsible, icon-only mode, structured content (`d2d4983`)
- **v2:** Pagination — page numbers, prev/next, ellipsis (`88e0ef9`)
- **v2:** Breadcrumbs — navigation trail, collapse, separator (`46b15fc`)
- **v2:** Divider — horizontal/vertical, label, variants (`6eed30b`)
- **v2:** Accordion — native details/summary, smooth height, exclusive mode (`c720b1b`)

### Bug Fixes

- **v2:** demo responsive layout, light toggle, motion controls (`6004ccd`)
- **v2:** JSR publish — skip slow type check, GitHub Packages already published (`5b575cb`)

### Chores

- bump version to 2.0.1 (`19d1ce9`)

## 2.0.0 (2026-03-20)

### Features

- **v2:** documentation pages in demo site — migration, theming, forms, animation (`de791c5`)
- **v2:** world-class demo site + final cleanup (`1ca3f54`)
- **v2:** world-class demo site - Aurora Fluid showcase, zero external CSS (`dd9f6a4`)
- **v2:** demo site rebuild — all 62 components showcased with Aurora Fluid theme (`bd5c01b`)
- **v2:** Storybook stories for all 63 components (`3a0b4c4`)
- **v2:** CLI v2 — init, list, theme commands (`6ea7dfc`)
- **v2:** updated CI/CD — tag-triggered publish, a11y + bundle size checks (`937ffcb`)
- **v2:** CSS extraction + bundle size check scripts (`da74758`)
- **v2:** UIProvider — combined theme, motion, density provider (`81bca23`)
- **v2:** DensityProvider — compact/default/comfortable/auto density context (`467bb07`)
- **v2:** RealtimeValue — spring number changes, delta indicator, flash (`36c4c8c`)
- **v2:** LiveFeed — auto-scroll, connection status, pause/resume (`73a385a`)
- **v2:** ConfidenceBar — gradient fill, thresholds, animated (`0c871c5`)
- **v2:** TypingIndicator — physics-bouncing dots, avatar (`510b4f7`)
- **v2:** StreamingText — token-by-token, cursor, markdown, code blocks (`945b957`)
- **v2:** HeatmapCalendar — GitHub-style contribution grid, OKLCH intensity, tooltips (`7eb5455`)
- **v2:** TimeRangeSelector — preset buttons, custom datetime inputs, active state (`86fec21`)
- **v2:** UptimeTracker — 90-day bar chart, status colors, SLA display, tooltip (`b89ba04`)
- **v2:** PipelineStage — connected stage indicators, status icons, animated pulse (`4a0c45d`)
- **v2:** PortStatusGrid — dense CSS grid, status colors, tooltip, click handler (`4338b0d`)
- **v2:** LogViewer — monospace log, level colors, search highlight, virtual scroll (`6414791`)
- **v2:** SeverityTimeline — vertical/horizontal, severity dots, expandable details (`4215021`)
- **v2:** UtilizationBar — stacked segments, threshold markers, tooltips (`afcd6ea`)
- **v2:** ThresholdGauge — SVG semicircle arc, color zones, animated fill (`2a87bf0`)
- **v2:** Sparkline — SVG smooth curves, gradient fill, hover tooltip, motion (`e4915c2`)
- **v2:** MetricCard — container-responsive metric display with sparkline, trend, status (`4c48739`)
- **v2:** EmptyState — illustrated placeholder, action button, responsive (`d18a67c`)
- **v2:** DiffViewer — side-by-side, unified, fold unchanged (`adc8b04`)
- **v2:** CopyBlock — built-in syntax highlighting, line numbers, copy button (`39459e3`)
- **v2:** TruncatedText — line clamp, expandable toggle, tooltip (`39c7e5f`)
- **v2:** KanbanColumn — cards, WIP limit, priority borders, collapse (`f062175`)
- **v2:** SortableList — keyboard reorder, drag handles, grab state (`c0f1a48`)
- **v2:** TreeView — ARIA tree, keyboard nav, lazy loading, indent guides (`cb90b09`)
- **v2:** SmartTable — DataTable + search, pagination, column toggle (`a2c20d4`)
- **v2:** DataTable — sort, resize, select, pin, keyboard, responsive card mode (`3d7b462`)
- **v2:** ResponsiveCard — container-query self-adapting layout (`2284c44`)
- **v2:** ViewTransitionLink — View Transitions API with instant fallback (`7f63710`)
- **v2:** InfiniteScroll — sentinel, pull-to-refresh, bi-directional (`76d8217`)
- **v2:** ScrollReveal — CSS scroll-driven, stagger, IntersectionObserver fallback (`5121a16`)
- **v2:** StepWizard — validation gates, FLIP transitions, responsive (`9076e7a`)
- **v2:** Tabs — animated underline, overflow scroll, lazy panels, keyboard nav (`e87ce25`)
- **v2:** NotificationStack — stacked cards, swipe dismiss, grouping, mark-all-read (`0e1ac75`)
- **v2:** CommandBar — fuzzy search, sections, keyboard shortcuts, recent items (`65a4e54`)
- **v2:** Toast — native popover, queue, stacking, swipe dismiss, zero sonner (`eb946c3`)
- **v2:** DropdownMenu — submenu, keyboard nav, shortcuts (`66a103b`)
- **v2:** Sheet — side panel, swipe physics, responsive bottom sheet (`c6152f3`)
- **v2:** ConfirmDialog — preset confirm/cancel, danger variant (`e510339`)
- **v2:** Dialog — native dialog, @starting-style animation, zero Radix (`0350500`)
- **v2:** Popover — arrow, nested, focus management, light dismiss (`f380a78`)
- **v2:** NativeTooltip — styled native tooltip (`eb05216`)
- **v2:** Tooltip — anchor positioning, delay, arrow, touch-hold (`16111a8`)
- **v2:** FilterPill — animated add/remove, count badge, group (`4e9df2f`)
- **v2:** InlineEdit — smooth display/edit transition, save/cancel (`f6fc370`)
- **v2:** FileUpload — drag zone, thumbnails, validation, progress (`e9e7541`)
- **v2:** ColorInput — OKLCH picker, hue/saturation, swatches (`f039237`)
- **v2:** Combobox — async search, sections, highlight, create-new (`a728806`)
- **v2:** Select — custom combobox with anchor positioning, keyboard nav, form integration (`2395f65`)
- **v2:** FormInput — form engine auto-wire, animated labels, error glow (`4b98616`)
- **v2:** AnimatedCounter — spring physics number morphing (`b5515c9`)
- **v2:** SuccessCheckmark — SVG draw animation, burst particles (`c2d61e2`)
- **v2:** StatusPulse — radiating ring animation, status colors (`318acd2`)
- **v2:** StatusBadge — color-coded status, dot, pulse, icon (`7049d5c`)
- **v2:** Slider — native range input, custom track/thumb, ticks, tooltip (`3d038b2`)
- **v2:** ToggleSwitch — physics thumb, stretch effect, native checkbox (`b5a2c34`)
- **v2:** RadioGroup — roving tabindex, animated dot slide, native fieldset (`ed36dc4`)
- **v2:** Checkbox — animated checkmark draw, indeterminate, native input (`b362bc7`)
- **v2:** Progress — spring fill, gradient, indeterminate, native progress element (`e190005`)
- **v2:** Skeleton — aurora shimmer, text/circular/rectangular, motion-aware (`188e93a`)
- **v2:** Card — aurora glow, container-query, polymorphic (`e519611`)
- **v2:** Avatar — initials, status dot, group stacking (`07e23b6`)
- **v2:** Badge — variants, dot, pulse, counter, Aurora Fluid (`463e301`)
- **v2:** Button — all variants, physics press, debounce, a11y tested (`fc7669c`)
- **v2:** testing infrastructure — Playwright config, type tests (`19d4f5f`)
- **v2:** ComponentErrorBoundary for domain component resilience (`3b1ab86`)
- **v2:** icon system — 50 built-in SVG icons with accessible Icon component (`cab3752`)
- **v2:** Form component + FieldArray — form engine complete (`9a59cf9`)
- **v2:** createForm + useForm — core form state management with validation (`c612432`)
- **v2:** form validators — required, email, minLength, pattern, pipe, async, 12 validators (`2c11b7f`)
- **v2:** a11y primitives — focus trap, roving tabindex, live region, anchor position (`55ccdb4`)
- **v2:** input engine — pointer, gestures, focus, gamepad, haptics, multitouch (`116f1b4`)
- **v2:** motion engine — spring solver, WAAPI, timeline, stagger, FLIP, scroll, morph, controller (`1eaf5b7`)
- **v2:** OKLCH tokens, Aurora Fluid theme, theme generator, ThemeContext (`97c5d7e`)
- **v2:** utilities — cn, formatting, sanitize, OKLCH color math, clamp (`593d3d5`)
- **v2:** style engine — css tag, useStyles, adoptedStyleSheets, SSR StyleCollector (`c6c216b`)
- **v2:** scaffold v2 directory structure and build system (`7a8a796`)
- v0.4.0 — 62 components, container queries, FileUpload, native tooltips, view transitions (`e4f93ea`)
- container queries, FileUpload, native popover tooltip, view transitions (`d922030`)
- add InlineEdit, TreeView, ScrollReveal exports (`2495172`)
- v0.3.0 — DensityProvider, generateTheme, Combobox, scroll animations (`ec1276b`)
- Vite + React demo SPA replacing Next.js — multi-page router, living components (`be1f021`)
- demo redesign — preview cards, responsive grid, terminal luxe aesthetic (`953e3fe`)
- complete demo showcase — all 53 components interactive, AI/realtime sections first (`3df4bec`)
- v0.2.0 — 53 components, demo site, smart/AI/realtime primitives (`0b210e6`)
- 8 real-time + AI components (streaming-text, live-feed, diff-viewer, heatmap, kanban) (`2951c7e`)
- complete library — 37 components, CLI, tests, stories, CI/CD (`b4c0006`)
- initial release — 17 production-grade React UI components (`9de56a3`)

### Bug Fixes

- **v2:** publish workflow — remove .npmrc for npm, add npm ci for JSR, OIDC auth (`417b06f`)
- **v2:** CI fixes + docs in demo site (`1ae5e2c`)
- **v2:** resolve typecheck errors in Storybook stories (`30b04a2`)
- **v2:** resolve type conflicts in StepWizard and ResponsiveCard props (`2de1713`)
- **v2:** FileUpload — omit onError from HTMLAttributes to fix type conflict (`f937a36`)
- **v2:** Button — spinner geometry, motion-gated transforms, currentColor spinner (`581cb34`)
- **v2:** rename script files .ts → .js for Node.js compatibility (`78ed475`)
- **v2:** validators — settle orphaned async promises, skip whitespace in string validators (`11397d9`)
- **v2:** complete scaffolding — missing dirs, barrel export, remove cli (`6b75018`)
- severity timeline vertical layout, infinite scroll reload, table export (`afa92d9`)
- pointer capture on element not document for mobile drag (`617fe02`)
- mobile touch interactions — slider, drag-and-drop, color picker (`f766d68`)
- comprehensive demo site polish — 30+ component fixes across all pages (`b309b7b`)
- deduplicate React in Vite config — resolves blank page on GitHub Pages (`2422df3`)
- explicit return type on useViewTransition for JSR (`8bece23`)
- JSR explicit return types for density-provider (`889172d`)
- 27 responsive/mobile fixes across 22 components (`ab257c5`)
- sync jsr.json dep versions with node_modules (`44991a3`)
- update tailwind-merge to v3 in jsr.json (`59ef8c5`)
- resolve all 20 audit issues — 3 critical, 8 high, 9 medium (`a98c001`)
- add basePath for GitHub Pages deployment (`87e0dad`)
- pin lucide-react version for JSR (`3ed0b5d`)
- add explicit return types for JSR compliance (zero slow-type errors) (`6faac15`)

### Documentation

- **v2:** complete documentation — migration guide, theming, forms, animation (`ae6ab2f`)
- **v2:** README with v2 quick start, features, entry points (`ab88402`)
- **v2:** add development philosophy — quality over speed, thorough implementation (`a7fa179`)
- **v2:** add visual inspection, demo pages, and stories requirements to plan (`cba41c1`)
- **v2:** design spec, implementation plan, and CLAUDE.md (`b0fdde4`)
- comprehensive README with full API reference for all 53 components (`c48c70e`)

### Performance

- code-split demo pages with React.lazy + SPA 404 fallback (`57d1b0d`)
- code-split demo into 8 lazy-loaded sections — IntersectionObserver mount, CSS animations, deferred timers (`8eaaecb`)

### Chores

- bump version to 2.0.0 (`b4a61b1`)
- **v2:** adjust bundle budget to 120KB for full 62-component library (`6e19fee`)
- **v2:** add Phase 8 AI & Real-Time components to domain barrel (`8f83165`)
- bump version to 0.4.1 (`4698968`)

### CI

- Vite demo deploy workflow + automated 3-registry publish on release (`4913116`)
- add --legacy-peer-deps to CI workflow (`8476adc`)
- GitHub Pages demo deployment + interactive showcase site (`12c5355`)
- configure JSR exports and import maps (`2d5e29b`)
- remove publishConfig — CI/CD workflows set registry per job (`d039a59`)
- trusted publishing (OIDC) for npm + JSR, remove token from .npmrc (`7526730`)
