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
 *   { $date: '2026-01-20T00:00' }  a Date — `new Date(string)` on both sides. Omit
 *                    the zone: both run with TZ=UTC, so it is the local midnight
 *                    a caller's date picker would produce
 *
 * Choose cases that change the MARKUP: every variant/size value that is an
 * attribute, every boolean that adds or removes an element, and the edge values
 * (0, empty, over-max). A case that renders the same tree as another adds
 * nothing. */

export type CaseProps = Record<string, unknown>

/* The clock every contract render sees. Components that format time relative
 * to now (NotificationStack's "5 minutes ago") would otherwise produce a fixture
 * that is right when generated and wrong a minute later. The generator pins
 * Date.now to this; the Svelte contract tests fake Date — and only Date — to it. */
export const CONTRACT_NOW = Date.UTC(2026, 0, 15, 12, 0, 0)

/* Exports that component-meta does not list (it lists one component per file),
 * mapped to the React source that exports them, so their cases can be rendered. */
export const SOURCES: Record<string, string> = {
  Icon: 'src/core/icons/icon.tsx',
  FilterPillGroup: 'src/components/filter-pill.tsx',
  SidebarHeader: 'src/components/sidebar.tsx',
  SidebarContent: 'src/components/sidebar.tsx',
  SidebarFooter: 'src/components/sidebar.tsx',
  SidebarItem: 'src/components/sidebar.tsx',
}

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
    'default checked': { label: 'Accept', defaultChecked: true },
    'motion 0': { motion: 0 },
  },
  Divider: {
    defaults: {},
    'vertical dashed lg': { orientation: 'vertical', variant: 'dashed', spacing: 'lg' },
    'label string': { label: 'or' },
    'label element': { label: { $el: 'section' } },
    'label empty string': { label: '' },
    'rest attrs': { id: 'd1', title: 'split' },
  },
  Kbd: {
    defaults: { children: { $el: 'K' } },
    'xs ghost': { size: 'xs', variant: 'ghost', children: { $el: 'Ctrl' } },
    'motion 0': { motion: 0 },
    'no children': {},
  },
  StatusPulse: {
    ok: { status: 'ok' },
    'critical lg label': { status: 'critical', size: 'lg', label: 'Down' },
    warning: { status: 'warning', size: 'sm' },
    'info motion 0': { status: 'info', motion: 0 },
  },
  TypingIndicator: {
    defaults: {},
    'avatar string sm': { avatar: 'AB', size: 'sm', label: 'Ada is typing' },
    'avatar element': { avatar: { $el: 'img' } },
    'motion 0': { motion: 0 },
  },
  ListLayout: {
    defaults: { children: { $el: 'row' } },
    'gap lg dividers padding sm': { gap: 'lg', dividers: true, padding: 'sm', children: { $el: 'row' } },
    'dividers false': { dividers: false },
  },
  PageShell: {
    defaults: { children: { $el: 'page' } },
    'xl none': { maxWidth: 'xl', padding: 'none', children: { $el: 'page' } },
    'full lg rest': { maxWidth: 'full', padding: 'lg', id: 'shell' },
  },
  SectionHeader: {
    'title only': { title: 'Usage' },
    'description action sm': { title: 'Usage', description: 'Last 30 days', action: { $el: 'Export' }, size: 'sm' },
    'action string lg': { title: 'Usage', action: 'Export', size: 'lg' },
    'empty description': { title: 'Usage', description: '' },
    'children are dropped': { title: 'Usage', children: { $el: 'ignored' } },
  },
  StatsGrid: {
    defaults: { children: { $el: 'stat' } },
    'columns 6 gap sm': { columns: 6, gap: 'sm', children: { $el: 'stat' } },
    'role override': { role: 'list' },
  },
  Toolbar: {
    defaults: { children: { $el: 'tools' } },
    'between wrap sticky lg': { justify: 'between', wrap: true, sticky: true, gap: 'lg' },
    'wrap false': { wrap: false, sticky: false },
  },
  AppShell: {
    'main only': { children: { $el: 'main' } },
    'all regions right collapsed': {
      navbar: { $el: 'nav' }, sidebar: 'side', footer: { $el: 'foot' },
      sidebarCollapsed: true, sidebarPosition: 'right', children: { $el: 'main' },
    },
    'empty-string sidebar reports true, renders nothing': { sidebar: '', children: { $el: 'main' } },
  },
  ButtonGroup: {
    defaults: { children: { $el: 'btns' } },
    'vertical xl ghost attached': { orientation: 'vertical', size: 'xl', variant: 'ghost', attached: true },
    'role override': { role: 'toolbar' },
    'motion 0': { motion: 0 },
  },
  Link: {
    defaults: { href: '/docs', children: { $el: 'Docs' } },
    'external defaults': { href: 'https://x.test', external: true },
    'external keeps caller target and rel': { href: 'https://x.test', external: true, target: '_self', rel: 'me' },
    'not external passes target through': { href: '/a', target: '_top' },
    'brand always xl': { variant: 'brand', underline: 'always', size: 'xl' },
  },
  PageHeader: {
    'title only': { title: 'Billing' },
    everything: { title: 'Billing', description: 'Invoices', actions: { $el: 'New' }, breadcrumbs: { $el: 'Home / Billing' }, size: 'lg' },
    'string actions': { title: 'Billing', actions: 'New', size: 'sm' },
  },
  StatusBadge: {
    ok: { status: 'ok' },
    'label icon pulse lg': { status: 'critical', label: 'Down', icon: { $el: '!' }, pulse: true, size: 'lg' },
    'maintenance empty label': { status: 'maintenance', label: '' },
    'motion 0': { status: 'info', motion: 0 },
  },
  ConfidenceBar: {
    medium: { value: 0.5 },
    'low string label lg': { value: 0.12, label: 'Match', size: 'lg' },
    'high element label, no value': { value: 0.93, label: { $el: 'Score' }, showValue: false },
    'no header': { value: 0.7, showValue: false },
    'custom thresholds': { value: 0.4, thresholds: { low: 0.5, medium: 0.9 } },
    'motion 0': { value: 1, motion: 0 },
  },
  Indicator: {
    defaults: { children: { $el: 'avatar' } },
    'numeric label bottom-start offset': { label: 3, position: 'bottom-start', offset: 4, children: { $el: 'avatar' } },
    'zero label': { label: 0 },
    'size and flags': { size: 14, processing: true, disabled: true, inline: true, withBorder: true, color: 'danger' },
    'top-start offset': { position: 'top-start', offset: 2 },
    'bottom-end offset, labelled': { position: 'bottom-end', offset: 6, label: 'new' },
    'motion 0': { motion: 0 },
  },
  Progress: {
    indeterminate: {},
    'half with value': { value: 50, showValue: true, label: 'Upload' },
    zero: { value: 0, showValue: true },
    'clamped over max': { value: 250, max: 200, variant: 'danger', size: 'xl' },
    'clamped negative': { value: -5 },
    'motion 0': { value: 10, motion: 0 },
  },
  CardGrid: {
    defaults: { children: { $el: 'card' } },
    'min child width': { minChildWidth: '14rem', columns: 4, gap: 'lg' },
    'caller style object merged': { style: { padding: 8, opacity: 0.5 }, minChildWidth: '10rem' },
    'caller style without min width': { style: { marginTop: 4 } },
  },
  Skeleton: {
    defaults: {},
    'sized numbers and strings': { variant: 'rounded', width: 120, height: '2rem', radius: 6 },
    'three lines': { lines: 3, lineHeight: 14, lineGap: '0.5rem' },
    'one line': { lines: 1 },
    'lines ignored when not text': { variant: 'circular', lines: 4, width: 40, height: 40 },
    'animate false pulse slow': { animate: false, animation: 'pulse', speed: 'slow' },
    'count row': { count: 3, width: 60, direction: 'column', motion: 1 },
    'count one renders single': { count: 1 },
    'caller style': { style: { marginInlineStart: 10 }, width: '50%' },
    'motion 0': { motion: 0 },
  },
  Typography: {
    body: { children: { $el: 'text' } },
    'h2 brand weight center': { variant: 'h2', color: 'brand', weight: 700, align: 'center', children: { $el: 'Title' } },
    'truncate true': { truncate: true },
    'truncate 1': { truncate: 1, variant: 'caption' },
    'truncate 3 lines': { truncate: 3, variant: 'body-sm' },
    'as label, code variant': { as: 'label', variant: 'code' },
    'caller style merged with weight': { style: { letterSpacing: 2, color: 'red' }, weight: 300 },
    'unknown variant falls back to span': { variant: 'nope' },
    'motion 0': { motion: 0 },
  },
  BorderBeam: {
    defaults: { children: { $el: 'panel' } },
    'duration size color': { duration: 2.5, size: 120, color: 'oklch(70% 0.2 200)', children: { $el: 'panel' } },
    'caller style': { style: { borderRadius: 12 } },
    'motion 0': { motion: 0 },
  },
  Highlight: {
    'single term, case-insensitive': { children: 'The quick brown fox', highlight: 'QUICK' },
    'several terms': { children: 'alpha beta gamma beta', highlight: ['beta', 'gamma'] },
    'case sensitive miss': { children: 'Alpha alpha', highlight: 'alpha', caseSensitive: true },
    'regex metacharacters are literal': { children: 'cost is $5.00 (net)', highlight: ['$5.00', '(net)'] },
    'no valid terms': { children: 'nothing here', highlight: ['', ''] },
    'term at both ends': { children: 'xx mid xx', highlight: 'xx' },
    'color and mark class': { children: 'find me', highlight: 'me', color: 'gold', highlightClassName: 'hit' },
  },
  ShimmerButton: {
    defaults: { children: { $el: 'Go' } },
    'color lg disabled': { shimmerColor: 'white', size: 'lg', disabled: true, children: { $el: 'Go' } },
    'no style at all': { size: 'sm', children: { $el: 'Go' } },
    'caller style': { style: { minWidth: 120 }, children: { $el: 'Go' } },
    'motion 0': { motion: 0, children: { $el: 'Go' } },
  },
  ViewTransitionLink: {
    defaults: { href: '/next', children: { $el: 'Next' } },
    'transition name': { href: '/hero', transitionName: 'hero', children: { $el: 'Hero' } },
    'caller style merged': { href: '/a', transitionName: 'card', style: { display: 'block' }, children: { $el: 'A' } },
    'no href': { children: { $el: 'Nowhere' } },
  },
  Card3D: {
    defaults: { children: { $el: 'card' } },
    'perspective, no glare': { perspective: 600, glare: false, children: { $el: 'card' } },
    'caller style': { style: { borderRadius: 16 } },
    'motion 0': { motion: 0 },
  },
  GlowCard: {
    defaults: { children: { $el: 'card' } },
    color: { glowColor: 'oklch(70% 0.2 150)', children: { $el: 'card' } },
    'caller style, no color': { style: { padding: 12 } },
    'motion 0': { motion: 0 },
  },
  SpotlightCard: {
    defaults: { children: { $el: 'card' } },
    color: { spotlightColor: 'white', children: { $el: 'card' } },
    'caller style with color': { style: { padding: 12 }, spotlightColor: 'gold' },
    'motion 0': { motion: 0 },
  },
  BackgroundBoxes: {
    'small grid': { rows: 2, cols: 3 },
    'with content and style': { rows: 1, cols: 2, style: { minHeight: 200 }, children: { $el: 'hero' } },
    'motion 0': { rows: 1, cols: 1, motion: 0 },
  },
  MeteorShower: {
    few: { count: 4 },
    'with content': { count: 2, children: { $el: 'hero' } },
    none: { count: 0 },
    'motion 0': { count: 1, motion: 0 },
  },
  OrbitingCircles: {
    three: { children: [{ $el: 'a' }, { $el: 'b' }, { $el: 'c' }] },
    'reverse radius duration': { radius: 60, duration: 8, reverse: true, children: [{ $el: 'a' }, 'b'] },
    'null and false dropped, 0 kept': { children: [{ $el: 'a' }, null, false, 'b', 0] },
    'caller style': { style: { width: 300 }, children: ['x'] },
    'motion 0': { motion: 0, children: ['x'] },
  },
  BackgroundBeams: {
    few: { count: 3 },
    'color, content, style': { count: 1, color: 'cyan', style: { minHeight: 120 }, children: { $el: 'hero' } },
    'no style at all': { count: 2 },
    'motion 0': { count: 1, motion: 0 },
  },
  WavyBackground: {
    two: { waveCount: 2 },
    'color speed content': { waveCount: 1, speed: 4, color: 'teal', children: { $el: 'hero' } },
    'caller style': { waveCount: 1, style: { height: 240 } },
    'motion 0': { waveCount: 1, motion: 0 },
  },
  RingChart: {
    value: { value: 42 },
    'show value lg thickness color': { value: 75, showValue: true, size: 'lg', thickness: 12, color: 'teal' },
    'string label names the meter': { value: 10, max: 40, label: 'CPU' },
    'element label': { value: 5, label: { $el: '5 GB' } },
    'empty-string label renders empty centre': { value: 50, label: '', showValue: true },
    'clamped': { value: 140, max: 120, size: 'sm' },
    'caller style wins over size': { value: 1, style: { width: 200 } },
    'motion 0': { value: 1, motion: 0 },
  },
  SuccessCheckmark: {
    defaults: {},
    'lg not animated custom label': { size: 'lg', animated: false, label: 'Saved' },
    'motion 2 has no particles': { motion: 2 },
    'motion 3 has particles': { motion: 3 },
    'motion 0': { motion: 0 },
  },
  ThresholdGauge: {
    value: { value: 30 },
    'ok warning critical': { value: 55, thresholds: { warning: 50, critical: 80 }, showValue: true },
    critical: { value: 95, thresholds: { warning: 50, critical: 80 }, size: 'lg' },
    'zero has no fill': { value: 0, thresholds: { warning: 50, critical: 80 } },
    'full, labelled': { value: 100, label: 'Disk', size: 'sm' },
    'element label': { value: 12, label: { $el: 'Load' } },
    'clamped negative': { value: -10 },
    'motion 0': { value: 1, motion: 0 },
  },
  PipelineStage: {
    'all statuses': {
      stages: [
        { id: 'a', label: 'Build', status: 'success', duration: 42 },
        { id: 'b', label: 'Test', status: 'running', duration: 125 },
        { id: 'c', label: 'Deploy', status: 'pending', duration: 120 },
        { id: 'd', label: 'Notify', status: 'skipped' },
        { id: 'e', label: 'Audit', status: 'failed', duration: 0 },
      ],
    },
    'vertical, clickable': { orientation: 'vertical', onStageClick: { $fn: true }, stages: [{ id: 'a', label: 'Build', status: 'success' }] },
    'single stage has no connector': { stages: [{ id: 'a', label: 'Only', status: 'pending' }] },
    empty: { stages: [] },
    'motion 0': { motion: 0, stages: [] },
  },
  ResponsiveCard: {
    'title only': { title: 'Plan' },
    everything: { title: { $el: 'Pro' }, description: 'For teams', actions: { $el: 'Buy' }, badge: 'New', image: { $el: 'img' }, variant: 'horizontal' },
    'compact string parts': { title: 'Lite', description: { $el: 'Solo' }, variant: 'compact' },
    'motion 0': { title: 'x', motion: 0 },
  },
  Button: {
    defaults: { children: { $el: 'Save' } },
    'secondary xs full width': { variant: 'secondary', size: 'xs', fullWidth: true, children: { $el: 'Save' } },
    'danger xl submit': { variant: 'danger', size: 'xl', type: 'submit', children: { $el: 'Delete' } },
    'ghost disabled': { variant: 'ghost', disabled: true, children: { $el: 'Off' } },
    'link with classNames': { variant: 'link', className: 'mine', classNames: { root: 'r', icon: 'i', iconEnd: 'e' }, icon: { $el: 'L' }, iconEnd: 'R', children: { $el: 'Go' } },
    'loading without text keeps children': { loading: true, children: { $el: 'Save' } },
    'loading text replaces children': { loading: true, loadingText: 'Saving…', children: { $el: 'Save' } },
    'loading text ignored when not loading': { loadingText: 'Saving…', children: { $el: 'Save' } },
    'icon only': { iconOnly: true, icon: { $el: 'x' }, 'aria-label': 'Close' },
    shortcuts: { shortcuts: { activate: 'Ctrl+S' }, children: { $el: 'Save' } },
    'motion 0': { motion: 0, children: { $el: 'Save' } },
  },
  Dialog: {
    'body only': { open: false, onClose: { $fn: true }, children: { $el: 'Body' } },
    'title and description': { open: false, onClose: { $fn: true }, title: 'Delete file', description: 'This cannot be undone.', children: { $el: 'Body' } },
    'no title, no close: no header': { open: false, onClose: { $fn: true }, showClose: false, children: { $el: 'Body' } },
    'description without title': { open: false, onClose: { $fn: true }, description: 'Only a description', children: { $el: 'Body' } },
    'element title, footer, size, classNames': {
      open: false, onClose: { $fn: true }, title: { $el: 'Rich' }, footer: { $el: 'Footer' }, size: 'full', className: 'mine',
      classNames: { root: 'r', header: 'h', title: 't', description: 'd', body: 'b', close: 'c', footer: 'f' },
      description: 'Desc', children: { $el: 'Body' },
    },
    'caller attributes on the dialog': { open: false, onClose: { $fn: true }, 'aria-label': 'Settings', showClose: false, children: { $el: 'Body' } },
    'motion 0': { open: false, onClose: { $fn: true }, motion: 0, children: { $el: 'Body' } },
  },
  ConfirmDialog: {
    defaults: { open: false, onConfirm: { $fn: true }, onCancel: { $fn: true }, title: 'Are you sure?' },
    'danger loading with description and labels': {
      open: false, onConfirm: { $fn: true }, onCancel: { $fn: true }, title: { $el: 'Delete' }, description: { $el: 'Gone forever' },
      variant: 'danger', loading: true, confirmLabel: 'Delete', cancelLabel: 'Keep',
    },
    'motion 0': { open: false, onConfirm: { $fn: true }, onCancel: { $fn: true }, title: 'Sure?', motion: 0 },
  },
  TopologyGraph: {
    empty: { nodes: [], edges: [] },
    'every node type and edge feature': {
      nodes: [
        { id: 'fw', label: 'Firewall', type: 'firewall', status: 'ok' },
        { id: 'rt', label: 'Router', type: 'router', status: 'warning' },
        { id: 'sw', label: 'Switch', type: 'switch', status: 'critical' },
        { id: 'sv', label: 'Server', type: 'server', status: 'maintenance' },
        { id: 'db', label: 'DB', type: 'database' },
        { id: 'lb', label: 'LB', type: 'loadbalancer', width: 60, height: 40 },
        { id: 'cl', label: 'Cloud', type: 'cloud' },
        // A string icon: an { $el } <b> inside <svg> is an HTML breakout tag, so parsing
        // React's server HTML would close the <svg> early. Snippet icons: topology-graph.test.ts.
        { id: 'cu', label: 'Custom', type: 'custom', icon: 'i' },
      ],
      edges: [
        { source: 'cl', target: 'fw', label: 'WAN', status: 'ok', bandwidth: 1000, animated: true },
        { source: 'fw', target: 'rt', bidirectional: true, status: 'warning' },
        { source: 'rt', target: 'sw', bandwidth: 50, status: 'critical' },
        { source: 'sw', target: 'sv' },
        { source: 'sw', target: 'db', animated: true },
        { source: 'lb', target: 'sv' },
        { source: 'ghost', target: 'sv' },
      ],
      selectedNodes: ['rt', 'lb'],
      onNodeClick: { $fn: true },
      onEdgeClick: { $fn: true },
      onNodeHover: { $fn: true },
      showLegend: true,
      showMinimap: true,
    },
    'dagre, pinned positions, no controls, string height': {
      nodes: [{ id: 'a', label: 'A', x: 50, y: 60 }, { id: 'b', label: 'B' }, { id: 'c', label: 'C' }],
      edges: [{ source: 'a', target: 'b' }, { source: 'b', target: 'c', label: 'x' }],
      layout: 'dagre', showControls: false, height: '100%', className: 'mine',
    },
    circular: { nodes: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }, { id: 'c', label: 'C' }], edges: [{ source: 'a', target: 'c' }], layout: 'circular', height: 300 },
    grid: { nodes: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }, { id: 'c', label: 'C' }, { id: 'd', label: 'D' }], edges: [], layout: 'grid' },
    'caller style replaces height': { nodes: [{ id: 'a', label: 'A' }], edges: [], style: { minHeight: 200 } },
    'minimap with no nodes renders nothing': { nodes: [], edges: [], showMinimap: true },
    'canvas renderer': { nodes: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }], edges: [{ source: 'a', target: 'b' }], renderer: 'canvas', height: 240 },
    'motion 0 has no keyframes and no dash': {
      nodes: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }], edges: [{ source: 'a', target: 'b', animated: true }], motion: 0,
    },
  },
  Calendar: {
    // CONTRACT_NOW is 2026-01-15, so "today" is inside January 2026.
    'today, no value': {},
    'uncontrolled defaultValue in another month': { defaultValue: { $date: '2025-11-03T00:00' } },
    'controlled value, min/max and disabled list': {
      value: { $date: '2026-01-20T00:00' }, minDate: { $date: '2026-01-05T09:30' }, maxDate: { $date: '2026-01-28T00:00' },
      disabledDates: [{ $date: '2026-01-21T00:00' }, { $date: '2026-01-22T00:00' }],
    },
    'value null is controlled-empty': { value: null, defaultValue: { $date: '2026-01-10T00:00' } },
    'monday start, week numbers, no outside days, lg': { value: { $date: '2026-03-10T00:00' }, firstDayOfWeek: 1, showWeekNumbers: true, showOutsideDays: false, size: 'lg' },
    'three months across a year boundary, no today highlight': { defaultValue: { $date: '2025-11-15T00:00' }, numberOfMonths: 3, highlightToday: false },
    'range display with hover end': { value: { $date: '2026-01-08T00:00' }, _rangeStart: { $date: '2026-01-08T00:00' }, _hoverDate: { $date: '2026-01-02T00:00' } },
    'range with explicit end beats hover': { _rangeStart: { $date: '2026-01-10T00:00' }, _rangeEnd: { $date: '2026-01-12T00:00' }, _hoverDate: { $date: '2026-01-25T00:00' } },
    'de-DE locale, caller attributes': { locale: 'de-DE', className: 'mine', id: 'cal', value: { $date: '2026-01-15T00:00' } },
    'motion 0': { motion: 0 },
  },
  FormInput: {
    'name only': { name: 'email' },
    'label, required, description, placeholder': { name: 'email', label: 'Email', required: true, description: 'We never share it', placeholder: 'you@example.com' },
    'error sets invalid and describedby order': { name: 'email', label: { $el: 'Email' }, description: 'Help', error: 'Required' },
    'controlled value with counter at limit, clearable': { name: 'code', 'aria-label': 'Code', value: 'ABCDE', maxLength: 5, clearable: true, onClear: { $fn: true } },
    'showCount without max, numeric value': { name: 'n', 'aria-label': 'N', value: 42, showCount: true },
    'clearable but empty shows no button': { name: 'q', 'aria-label': 'Q', value: '', clearable: true },
    'icons, filled xl, disabled, caller id and attrs': {
      name: 'search', 'aria-label': 'Search', icon: { $el: 's' }, iconEnd: { $el: 'k' }, variant: 'filled', size: 'xl', disabled: true, id: 'mine', type: 'search', autoComplete: 'off',
    },
    'classNames everywhere': {
      name: 'x', label: 'L', description: 'D', error: 'E', icon: 'i', iconEnd: 'j', className: 'root-extra',
      classNames: { root: 'r', label: 'l', field: 'f', icon: 'ic', iconEnd: 'ie', description: 'd', error: 'e' },
    },
    'motion 0': { name: 'x', 'aria-label': 'X', motion: 0 },
  },
  Textarea: {
    labelled: { label: 'Notes', name: 'notes' },
    'uncontrolled defaultValue with count': { label: 'Bio', defaultValue: 'Hello there', showCount: true },
    'controlled at limit, error, description, required, placeholder': {
      label: 'Bio', value: 'abcde', maxLength: 5, error: 'Too long', description: 'Short bio', required: true, placeholder: 'Type…',
    },
    'resize none, minRows, lg disabled, caller id and attrs': { label: 'X', resize: 'none', minRows: 6, size: 'lg', disabled: true, id: 'ta', className: 'mine', 'data-x': '1' },
    'autoResize forces data-resize none': { label: 'Auto', autoResize: true, resize: 'both', minRows: 2, maxRows: 4 },
    'motion 0': { label: 'M', motion: 0 },
  },
  PasswordInput: {
    labelled: { label: 'Password', name: 'pw' },
    'no toggle, placeholder, required, description': { label: 'Password', visibilityToggle: false, placeholder: '••••', required: true, description: 'At least 8' },
    'strength meter empty': { label: 'Password', showStrengthMeter: true, value: '' },
    'strength meter strong with error': { label: 'Password', showStrengthMeter: true, value: 'Abcdef1!', error: 'Reused', onStrengthChange: { $fn: true } },
    'strength meter fair, custom labels, sm disabled, caller id': {
      label: 'Password', showStrengthMeter: true, value: 'abc1', strengthLabels: ['none', 'w', 'f', 'g', 's'], size: 'sm', disabled: true, id: 'pw', className: 'mine',
    },
    'motion 0': { label: 'M', motion: 0 },
  },
  NumberInput: {
    labelled: { label: 'Qty', name: 'qty' },
    'default value formatted with separator, prefix, suffix, precision': {
      label: 'Price', defaultValue: 1234567.5, thousandSeparator: true, prefix: '$', suffix: ' USD', precision: 2,
    },
    'controlled at max and min bounds': { label: 'N', value: 10, min: 0, max: 10 },
    'at min with error, description, required, placeholder': { label: 'N', value: 0, min: 0, error: 'Low', description: 'd', required: true, placeholder: '0' },
    'null value, hide controls, readOnly xl, caller id': { label: 'N', value: null, hideControls: true, readOnly: true, size: 'xl', id: 'num', className: 'mine' },
    'disabled': { label: 'N', value: 3, disabled: true },
    'motion 0': { label: 'M', motion: 0 },
  },
  Spotlight: {
    closed: { actions: [] },
    'open, no actions': { open: true, actions: [], onOpenChange: { $fn: true } },
    'open with grouped actions and icons': {
      open: true,
      actions: [
        { id: 'home', title: 'Home', description: 'Go home', group: 'Navigation', icon: { $el: 'h' }, onClick: { $fn: true } },
        { id: 'docs', title: 'Docs', group: 'Navigation', onClick: { $fn: true } },
        { id: 'theme', title: 'Toggle theme', group: 'Settings', keywords: ['dark'], onClick: { $fn: true } },
      ],
    },
    'ungrouped, limit, custom shortcut and placeholder, caller attrs': {
      open: true, limit: 2, shortcut: 'ctrl+shift+p', placeholder: 'Type a command', className: 'mine', id: 'spot',
      actions: [
        { id: 'a', title: 'Alpha', onClick: { $fn: true } },
        { id: 'b', title: 'Beta', onClick: { $fn: true } },
        { id: 'c', title: 'Gamma', onClick: { $fn: true } },
      ],
    },
    'alt shortcut glyphs': { open: true, shortcut: 'cmd+alt+k', actions: [{ id: 'a', title: 'Alpha', onClick: { $fn: true } }] },
    'motion 0': { open: true, motion: 0, actions: [] },
  },
  ContainerQuery: {
    children: { children: { $el: 'content' } },
    'caller style merges after container-type, class and attrs': { children: { $el: 'c' }, style: { padding: 8, containerType: 'size' }, className: 'mine', id: 'cq' },
  },
  Sheet: {
    'body only': { open: false, onClose: { $fn: true }, children: { $el: 'Body' } },
    'left lg with title and description': { open: false, onClose: { $fn: true }, side: 'left', size: 'lg', title: 'Filters', description: 'Narrow results', children: { $el: 'Body' } },
    'bottom, element title, no close': { open: false, onClose: { $fn: true }, side: 'bottom', title: { $el: 'T' }, showClose: false, children: { $el: 'Body' } },
    'no title and no close: no header; caller attrs': { open: false, onClose: { $fn: true }, showClose: false, className: 'mine', 'aria-label': 'Panel', children: { $el: 'Body' } },
    'motion 0': { open: false, onClose: { $fn: true }, motion: 0, children: { $el: 'Body' } },
  },
  SegmentedControl: {
    'strings, first is active by default': { data: ['Day', 'Week', 'Month'], 'aria-label': 'Range' },
    'objects with icons, disabled option, controlled': {
      'aria-label': 'View', value: 'grid',
      data: [{ value: 'list', label: 'List', icon: { $el: 'l' } }, { value: 'grid', label: { $el: 'Grid' } }, { value: 'map', label: 'Map', disabled: true }],
    },
    'vertical xl full width, color, caller style and class': {
      'aria-label': 'V', data: ['A', 'B'], defaultValue: 'B', orientation: 'vertical', size: 'xl', fullWidth: true, color: 'red', style: { margin: 4 }, className: 'mine',
    },
    'disabled and readOnly': { 'aria-label': 'D', data: ['A', 'B'], disabled: true, readOnly: true },
    'empty data': { 'aria-label': 'E', data: [] },
    'motion 0': { 'aria-label': 'M', data: ['A'], motion: 0 },
  },
  Combobox: {
    'closed, no selection': { name: 'fw', options: [{ value: 'svelte', label: 'Svelte' }], 'aria-label': 'Framework' },
    'label, uncontrolled default shows its label, lg': { name: 'fw', label: 'Framework', size: 'lg', defaultValue: 'react', options: [{ value: 'svelte', label: 'Svelte' }, { value: 'react', label: 'React' }] },
    'controlled, error, disabled, placeholder, caller attrs': {
      name: 'fw', label: { $el: 'FW' }, value: 'svelte', error: 'Pick one', disabled: true, placeholder: 'Find…', className: 'mine', id: 'cb',
      options: [{ value: 'svelte', label: 'Svelte' }],
    },
    'value not in options leaves the input empty': { name: 'fw', 'aria-label': 'F', value: 'vue', options: [{ value: 'svelte', label: 'Svelte' }] },
    'motion 0': { name: 'fw', 'aria-label': 'F', motion: 0, options: [] },
  },
  Select: {
    'no label (unnamed trigger)': { name: 's', options: [{ value: 'a', label: 'A' }] },
    'label, selected with icon, clearable, xl': {
      name: 's', label: 'Size', size: 'xl', clearable: true, defaultValue: 'm',
      options: [{ value: 's', label: 'Small' }, { value: 'm', label: 'Medium', icon: { $el: 'i' } }],
    },
    'controlled, error, disabled, custom placeholder, caller attrs': {
      name: 's', label: { $el: 'L' }, value: '', error: 'Required', disabled: true, placeholder: 'Pick…', className: 'mine', id: 'sel', options: [],
    },
    'multiple with two tags and hidden inputs': {
      name: 'tags', label: 'T', multiple: true, clearable: true, value: ['a', 'b'],
      options: [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }, { value: 'c', label: 'Gamma' }],
    },
    'multiple with four collapses to +2 more': {
      name: 'tags', label: 'T', multiple: true, value: ['a', 'b', 'c', 'd'],
      options: ['a', 'b', 'c', 'd'].map(v => ({ value: v, label: v.toUpperCase() })),
    },
    'multiple empty shows placeholder': { name: 'tags', label: 'T', multiple: true, options: [] },
    'motion 0': { name: 's', label: 'S', motion: 0, options: [] },
  },
  MultiSelect: {
    'placeholder, no name': { label: 'Tags', options: [{ value: 'a', label: 'A' }] },
    'selected tags, hidden inputs, clearable, lg': {
      label: 'Tags', name: 'tags', size: 'lg', clearable: true, defaultValue: ['b', 'a', 'missing'],
      options: [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }],
    },
    'disabled hides remove and clear; error; not searchable is readonly': {
      label: 'Tags', value: ['a'], disabled: true, clearable: true, error: 'Too many', searchable: false, className: 'mine', id: 'ms',
      options: [{ value: 'a', label: 'Alpha' }],
    },
    'motion 0': { label: 'M', motion: 0, options: [] },
  },
  DatePicker: {
    empty: { 'aria-label': 'Date' },
    'label, uncontrolled default, placeholder, lg': { label: 'Start', defaultValue: '2026-03-09', placeholder: 'Pick a date', size: 'lg' },
    'controlled, error, disabled, caller attrs': { label: { $el: 'Due' }, value: '2025-12-31', error: 'In the past', disabled: true, className: 'mine', id: 'dp' },
    'motion 0': { 'aria-label': 'D', motion: 0 },
  },
  ActionIcon: {
    defaults: { 'aria-label': 'Edit', children: { $el: 'pencil' } },
    'filled danger xl full loading': { 'aria-label': 'Delete', variant: 'filled', color: 'danger', size: 'xl', radius: 'full', loading: true },
    disabled: { 'aria-label': 'Save', disabled: true },
    'type submit': { 'aria-label': 'Send', type: 'submit' },
    'motion 0': { 'aria-label': 'x', motion: 0 },
  },
  ToggleSwitch: {
    label: { label: 'Wi-Fi' },
    'controlled on': { label: 'Wi-Fi', checked: true },
    'controlled off': { label: 'Wi-Fi', checked: false },
    'uncontrolled default on': { label: 'Wi-Fi', defaultChecked: true },
    'disabled error xl': { label: { $el: 'Bluetooth' }, disabled: true, error: 'Unavailable', size: 'xl' },
    'explicit id and rest to input': { label: 'Wi-Fi', id: 'wifi', name: 'wifi' },
    'motion 0': { label: 'x', motion: 0 },
  },
  Breadcrumbs: {
    three: { items: [{ label: 'Home', href: '/' }, { label: 'Docs', href: '/docs' }, { label: 'Now' }] },
    'custom separator, icons, element label': {
      separator: '/',
      items: [{ label: 'Home', href: '/', icon: { $el: 'h' } }, { label: { $el: 'Docs' } }, { label: 'Now', icon: 'x' }],
    },
    'collapsed to maxVisible 3': {
      maxVisible: 3,
      items: [{ label: 'A', href: '/a' }, { label: 'B', href: '/b' }, { label: 'C', href: '/c' }, { label: 'D', href: '/d' }, { label: 'E' }],
    },
    'maxVisible not exceeded': { maxVisible: 5, items: [{ label: 'A', href: '/a' }, { label: 'B' }] },
    'item without href gets #': { items: [{ label: 'A' }, { label: 'B' }] },
    single: { items: [{ label: 'Only' }] },
  },
  TimeRangeSelector: {
    'default presets': {},
    'custom presets, one active': {
      presets: [{ label: 'Day', value: 'd', range: [0, 86400000] }, { label: 'Week', value: 'w', range: [0, 604800000] }],
      value: [0, 86400000],
    },
    'show custom with value (UTC)': {
      presets: [{ label: 'Day', value: 'd', range: [0, 86400000] }],
      value: [1767225600000, 1767312000000],
      showCustom: true,
    },
    'show custom without value': { presets: [], showCustom: true },
    'motion 0': { presets: [], motion: 0 },
  },
  Alert: {
    info: { variant: 'info', children: { $el: 'Heads up' } },
    'success title sm': { variant: 'success', title: 'Saved', size: 'sm', children: { $el: 'All good' } },
    'warning banner compact': { variant: 'warning', banner: true, compact: true, children: { $el: 'Careful' } },
    'error dismissible with action': { variant: 'error', title: { $el: 'Failed' }, dismissible: true, action: { label: 'Retry', onClick: { $fn: true } }, children: { $el: 'x' } },
    'custom icon and classNames': {
      variant: 'info', icon: { $el: 'i' }, dismissible: true,
      classNames: { root: 'r', icon: 'ic', content: 'co', title: 'ti', body: 'bo', dismiss: 'di' }, title: 'T',
      children: { $el: 'x' },
    },
    'motion 0': { variant: 'info', motion: 0 },
  },
  FilterPill: {
    plain: { label: 'Region' },
    'active count icon sm': { label: 'Region', active: true, count: 3, icon: { $el: 'globe' }, size: 'sm' },
    'count zero': { label: 'Region', count: 0 },
    removable: { label: 'Region', onRemove: { $fn: true }, active: true, count: 2 },
    'rest to the main button': { label: 'Region', onRemove: { $fn: true }, title: 'filter by region' },
    'motion 0': { label: 'x', motion: 0 },
  },
  FilterPillGroup: {
    'children only': { children: { $el: 'pills' } },
    'clear all': { onClearAll: { $fn: true }, children: { $el: 'pills' } },
    'custom clear label': { onClearAll: { $fn: true }, clearLabel: 'Reset' },
  },
  Icon: {
    'chevron-down': { name: 'chevron-down' },
    'labelled lg': { name: 'x', size: 'lg', label: 'Close' },
    'numeric size, class, rest': { name: 'x', size: 30, className: 'k', 'data-x': '1' },
    'unknown name renders nothing': { name: 'no-such-icon' },
  },
  Pagination: {
    'fits without truncation': { page: 2, totalPages: 7, onChange: { $fn: true } },
    'right ellipsis only': { page: 2, totalPages: 20, onChange: { $fn: true } },
    'left ellipsis only': { page: 19, totalPages: 20, onChange: { $fn: true } },
    'both ellipses': { page: 10, totalPages: 20, onChange: { $fn: true }, showFirst: true },
    'wider siblings, no prev/next': { page: 10, totalPages: 30, siblingCount: 2, showPrevNext: false, onChange: { $fn: true } },
    'first page disables back': { page: 1, totalPages: 3, showFirst: true, onChange: { $fn: true }, size: 'xs' },
    'last page disables forward': { page: 3, totalPages: 3, showFirst: true, onChange: { $fn: true } },
    'no pages': { page: 1, totalPages: 0, onChange: { $fn: true } },
    'motion 0': { page: 1, totalPages: 1, onChange: { $fn: true }, motion: 0 },
  },
  Stepper: {
    'horizontal middle active': {
      activeStep: 1,
      steps: [
        { id: 'a', label: 'Account', description: 'Sign up' },
        { id: 'b', label: { $el: 'Plan' }, optional: true },
        { id: 'c', label: 'Pay', icon: { $el: '$' } },
      ],
    },
    'completed step with custom icon keeps the icon': {
      activeStep: 2,
      steps: [{ id: 'a', label: 'A', icon: 'i' }, { id: 'b', label: 'B' }, { id: 'c', label: 'C' }],
    },
    'vertical dots lg clickable': {
      orientation: 'vertical', variant: 'dots', size: 'lg', activeStep: 0, onStepClick: { $fn: true },
      steps: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B', description: 'desc' }],
    },
    'all complete': { activeStep: 5, steps: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }] },
    'motion 0': { activeStep: 0, motion: 0, steps: [{ id: 'a', label: 'A' }] },
  },
  NotificationStack: {
    empty: { notifications: [] },
    'custom empty message': { notifications: [], emptyMessage: 'All caught up', onDismissAll: { $fn: true } },
    'mixed with relative times': {
      onDismiss: { $fn: true }, onDismissAll: { $fn: true }, onMarkAllRead: { $fn: true },
      notifications: [
        { id: 'a', title: 'Deploy done', timestamp: Date.UTC(2026, 0, 15, 12, 0, 0) - 30000, variant: 'success', description: 'v3.0.0', action: { label: 'View', onClick: { $fn: true } } },
        { id: 'b', title: 'Disk 90%', timestamp: Date.UTC(2026, 0, 15, 12, 0, 0) - 5 * 60000, variant: 'warning', icon: { $el: '!' }, read: true },
        { id: 'c', title: 'Backup', timestamp: Date.UTC(2026, 0, 15, 12, 0, 0) - 3 * 3600000 },
        { id: 'd', title: 'Invoice', timestamp: Date.UTC(2026, 0, 15, 12, 0, 0) - 2 * 86400000, read: false },
      ],
    },
    grouped: {
      notifications: [
        { id: 'a', title: 'A', timestamp: Date.UTC(2026, 0, 15, 12, 0, 0), group: 'Today' },
        { id: 'b', title: 'B', timestamp: Date.UTC(2026, 0, 15, 12, 0, 0), group: 'Today' },
        { id: 'c', title: 'C', timestamp: Date.UTC(2026, 0, 15, 12, 0, 0), group: 'Earlier', read: true },
        { id: 'd', title: 'D', timestamp: Date.UTC(2026, 0, 15, 12, 0, 0) },
      ],
    },
    'maxVisible cuts, unread still counted from all': {
      maxVisible: 1, onMarkAllRead: { $fn: true },
      notifications: [{ id: 'a', title: 'A', timestamp: Date.UTC(2026, 0, 15, 12, 0, 0), read: true }, { id: 'b', title: 'B', timestamp: Date.UTC(2026, 0, 15, 12, 0, 0) }],
    },
    'all read hides mark-all': { onMarkAllRead: { $fn: true }, notifications: [{ id: 'a', title: 'A', timestamp: Date.UTC(2026, 0, 15, 12, 0, 0), read: true }] },
    'motion 0': { motion: 0, notifications: [] },
  },
  Sidebar: {
    defaults: { children: { $el: 'nav' } },
    'collapsed right string widths': { collapsed: true, position: 'right', width: '18rem', collapsedWidth: '4rem' },
    'caller style wins over width vars': { width: 300, style: { '--sidebar-width': '10px', padding: 4 } },
    'motion 0': { motion: 0 },
  },
  SidebarContent: { basic: { children: { $el: 'x' }, className: 'c', id: 'sc' } },
  SidebarFooter: { basic: { children: { $el: 'x' } } },
  SidebarHeader: { basic: { children: { $el: 'x' }, title: 'h' } },
  SidebarItem: {
    button: { label: 'Settings' },
    'link active icon': { label: 'Home', href: '/', active: true, icon: { $el: 'h' } },
    'empty href is a button': { label: 'X', href: '' },
    'rest attrs': { label: 'X', id: 'i', 'aria-label': 'x item' },
  },
  ConnectionTestPanel: {
    'every status': {
      steps: [
        { id: 'a', label: 'DNS', status: 'passed', duration: 12 },
        { id: 'b', label: 'TLS', status: 'failed', duration: 1234, message: 'expired' },
        { id: 'c', label: 'Auth', status: 'skipped' },
        { id: 'd', label: 'Query', status: 'running' },
        { id: 'e', label: 'Close', status: 'pending', duration: 999 },
      ],
      onRetry: { $fn: true },
    },
    'running shows cancel, hides retry': { running: true, onRetry: { $fn: true }, onCancel: { $fn: true }, title: 'LDAP', size: 'lg', steps: [] },
    'no failures or skips': { steps: [{ id: 'a', label: 'Ping', status: 'passed', duration: 1000 }] },
    'motion 0': { motion: 0, steps: [] },
  },
  GeoMap: {
    'points only': { points: [{ id: 'a', lat: 51.5, lng: -0.12 }] },
    'values, statuses, labels, connections': {
      showLabels: true,
      points: [
        { id: 'lon', lat: 51.5, lng: -0.12, value: 40, status: 'ok', label: 'London' },
        { id: 'nyc', lat: 40.7, lng: -74, value: 100, status: 'critical', label: 'New York' },
        { id: 'syd', lat: -33.9, lng: 151.2, status: 'warning' },
      ],
      connections: [
        { from: 'lon', to: 'nyc', status: 'warning' },
        { from: 'nyc', to: 'syd' },
        { from: 'lon', to: 'missing' },
      ],
    },
    'interactive, height number, style': { interactive: true, height: 300, style: { border: '1px solid' }, points: [{ id: 'a', lat: 0, lng: 0 }] },
    'height string beats caller style height': { height: '50vh', style: { height: 10 }, points: [] },
    'motion 0': { motion: 0, points: [] },
  },
  Card: {
    defaults: { children: { $el: 'body' } },
    'as article, elevated, header and footer': { as: 'article', variant: 'elevated', padding: 'lg', header: 'Title', footer: { $el: 'foot' }, children: { $el: 'body' } },
    'expandable with header': { expandable: true, header: { $el: 'Title' }, children: { $el: 'body' } },
    'expandable without header': { expandable: true, children: { $el: 'body' } },
    'expandable, collapsed by default': { expandable: true, defaultExpanded: false, header: 'T', children: { $el: 'body' } },
    'expandable with caller style drops cursor': { expandable: true, style: { padding: 4 }, children: { $el: 'body' } },
    'flags and classNames': {
      interactive: true, bordered: true, variant: 'glass', padding: 'none', header: 'h', footer: 'f', expandable: true,
      classNames: { root: 'r', header: 'hd', footer: 'ft', content: 'ct' }, children: { $el: 'body' },
    },
    loading: { loading: true, children: { $el: 'body' } },
    'motion 0': { motion: 0 },
    'motion 1 (no entrance)': { motion: 1, children: { $el: 'body' } },
  },
  EmptyState: {
    'title only': { title: 'Nothing here' },
    everything: { icon: { $el: 'i' }, title: { $el: 'No results' }, description: 'Try another search', action: { $el: 'Reset' }, secondaryAction: 'Help', size: 'lg' },
    'secondary action only': { title: 'x', secondaryAction: { $el: 'Help' }, size: 'sm' },
    'motion 0': { title: 'x', motion: 0 },
  },
  MetricCard: {
    basic: { title: 'Requests', value: '1.2k' },
    'change, trend, period, status, icon': {
      title: 'Latency', value: { $el: '42ms' }, icon: { $el: 'i' }, status: 'warning', trend: 'up', change: { value: 12, period: 'last week' },
    },
    'negative and zero change': { title: 'Errors', value: 3, change: { value: -4 }, trend: 'down' },
    'zero change': { title: 'Errors', value: 3, change: { value: 0 }, trend: 'flat' },
    'sparkline': { title: 'CPU', value: '40%', sparkline: [3, 5, 2, 8, 6] },
    'flat sparkline range': { title: 'CPU', value: '40%', sparkline: [4, 4, 4] },
    'short sparkline hidden': { title: 'CPU', value: '40%', sparkline: [4] },
    loading: { title: 'CPU', value: '40%', loading: true },
    'error hides change and sparkline': { title: 'CPU', value: '40%', error: 'Down', change: { value: 1 }, sparkline: [1, 2] },
    'empty when no value': { title: 'CPU', value: '', empty: { $el: 'No data' }, sparkline: [1, 2] },
    'value 0 shows empty (inherited)': { title: 'Queue', value: 0, empty: 'No data' },
    'element title has no aria-label': { title: { $el: 'CPU' }, value: 1 },
    'motion 0': { title: 'x', value: 1, motion: 0 },
  },
  PropertyList: {
    basic: { items: [{ label: 'Host', value: 'db-1' }, { label: 'Port', value: 5432 }] },
    'every item option, two columns striped lg': {
      columns: 2, striped: true, size: 'lg',
      items: [
        { label: 'ID', value: 'abc', mono: true, copyable: true },
        { label: 'Docs', value: { $el: 'link' }, href: 'https://x.test' },
        { label: 'Zero', value: 0 },
      ],
    },
    empty: { items: [] },
    'motion 0': { items: [], motion: 0 },
  },
  ServiceStrip: {
    basic: { services: [{ name: 'api', status: 'running', version: '3.0.0' }, { name: 'db', status: 'error' }] },
    'overflow sm icons': {
      size: 'sm', maxVisible: 2,
      services: [{ name: 'a', status: 'running', icon: { $el: 'i' } }, { name: 'b', status: 'stopped' }, { name: 'c', status: 'unknown' }, { name: 'd', status: 'running' }],
    },
    'maxVisible equal to length: no overflow': { maxVisible: 1, services: [{ name: 'a', status: 'running' }] },
    clickable: { onServiceClick: { $fn: true }, services: [{ name: 'a', status: 'running' }] },
    'empty renders nothing': { services: [] },
    'motion 0': { motion: 0, services: [{ name: 'a', status: 'running' }] },
  },
  EntityCard: {
    'name only': { name: 'db-primary' },
    everything: {
      name: 'db-primary', type: 'PostgreSQL', status: 'warning', icon: { $el: 'db' }, size: 'lg', compact: true,
      metrics: [{ label: 'CPU', value: '42%' }, { label: 'Conns', value: '120' }],
      tags: ['prod', 'eu-west'],
      actions: [{ label: 'Restart', icon: { $el: 'r' }, onClick: { $fn: true } }, { label: 'Logs', onClick: { $fn: true } }],
    },
    'href makes a link and clickable': { name: 'api', href: '/services/api' },
    'onClick makes it clickable': { name: 'api', onClick: { $fn: true } },
    'empty lists render no sections': { name: 'x', metrics: [], tags: [], actions: [] },
    'motion 0': { name: 'x', motion: 0 },
  },
  NetworkTrafficCard: {
    basic: { title: 'eth0', traffic: { inbound: 125, outbound: 0 } },
    'every unit, vendor and location, trend': {
      title: 'core-sw', vendor: 'Arista', location: 'DC1', status: 'warning', compact: true,
      traffic: { inbound: 1.5e6, outbound: 2e11 }, trend: [1, 4, 2, 9],
    },
    'kbps and tbps': { title: 'x', traffic: { inbound: 2000, outbound: 3e11 } },
    'vendor only': { title: 'x', vendor: 'Juniper', traffic: { inbound: 1, outbound: 1 } },
    'location only, one-point trend hidden': { title: 'x', location: 'DC2', traffic: { inbound: 1, outbound: 1 }, trend: [3] },
    'element title': { title: { $el: 'uplink' }, traffic: { inbound: 1, outbound: 1 } },
    'motion 0': { title: 'x', traffic: { inbound: 1, outbound: 1 }, motion: 0 },
  },
  RackDiagram: {
    'front view': { units: 6, devices: [{ startU: 1, heightU: 2, label: 'server', status: 'ok' }, { startU: 5, heightU: 1, label: 'switch', status: 'critical' }] },
    'rear view lg no numbers': { units: 4, orientation: 'rear', size: 'lg', showUnitNumbers: false, devices: [{ startU: 2, heightU: 1, label: 'pdu' }] },
    'empty rack sm': { units: 3, devices: [], size: 'sm' },
    'motion 0': { units: 1, devices: [], motion: 0 },
  },
  Ripple: {
    defaults: { children: { $el: 'Press' } },
    'color, duration, caller style': { color: 'white', duration: 900, style: { borderRadius: 8 }, children: { $el: 'Press' } },
    'motion 0': { motion: 0, children: { $el: 'x' } },
  },
  TruncatedText: {
    defaults: { text: 'A long description' },
    'three lines expandable': { text: 'A long description', lines: 3, expandable: true },
    'no tooltip': { text: 'x', showTooltip: false, id: 't1' },
  },
  CoreChart: {
    'green-red auto columns': { cores: [0, 25, 50, 75, 100, 130].map((usage, id) => ({ id, usage })) },
    'blue-red labels lg columns': { colorScale: 'blue-red', showLabels: true, size: 'lg', columns: 2, cores: [{ id: 0, usage: -5 }, { id: 1, usage: 60 }] },
    brand: { colorScale: 'brand', cores: [{ id: 0, usage: 33 }] },
    empty: { cores: [] },
    'motion 0': { cores: [], motion: 0 },
  },
  PortStatusGrid: {
    basic: { ports: [{ port: 22, status: 'ok', label: 'ssh' }, { port: 443, status: 'critical' }] },
    'clickable sm columns': { size: 'sm', columns: 4, onPortClick: { $fn: true }, ports: [{ port: 22, status: 'ok', label: 'ssh' }, { port: 80, status: 'unknown' }] },
    'motion 0': { ports: [], motion: 0 },
  },
  UptimeTracker: {
    basic: { days: [{ date: '2026-09-01', status: 'up', uptime: 1 }, { date: '2026-09-02', status: 'down', uptime: 0.5 }] },
    'sla with target': { showSla: true, slaTarget: 0.999, days: [{ date: 'a', status: 'up', uptime: 0.99951 }, { date: 'b', status: 'degraded' }] },
    'sla all 100 percent': { showSla: true, days: [{ date: 'a', status: 'up', uptime: 1 }] },
    'sla with no uptime data': { showSla: true, days: [{ date: 'a', status: 'unknown' }] },
    'motion 0': { days: [], motion: 0 },
  },
  Sparkline: {
    basic: { data: [3, 7, 2, 9] },
    'width number, colour, tooltip, no gradient': { data: [1, 2], width: 120, height: 20, color: 'teal', gradient: false, showTooltip: true },
    'width string, caller style': { data: [5, 5, 5], width: '50%', style: { opacity: 0.8 } },
    'too few points': { data: [4] },
    'motion 0': { data: [], motion: 0 },
  },
  StorageBar: {
    basic: { total: 1000, segments: [{ label: 'System', value: 120 }, { label: 'Apps', value: 300, color: 'gold' }] },
    'labels, legend, TB, lg': { total: 4096, showLabels: true, showLegend: true, size: 'lg', segments: [{ label: 'Media', value: 2048 }, { label: 'Docs', value: 1.5 }] },
    'seven segments wrap default colours': { total: 70, segments: [1, 2, 3, 4, 5, 6, 7].map(n => ({ label: 's' + n, value: n })) },
    'motion 0': { total: 1, segments: [], motion: 0 },
  },
  UtilizationBar: {
    basic: { segments: [{ value: 30 }, { value: 25, color: 'red' }] },
    'thresholds, labels, max, sm': { max: 200, size: 'sm', showLabels: true, thresholds: { warning: 70, critical: 90 }, segments: [{ value: 50, label: 'CPU' }, { value: 20 }, { value: 10, label: 'IO', color: '' }] },
    'labels hidden when none labelled': { showLabels: true, segments: [{ value: 5 }] },
    'motion 0': { segments: [], motion: 0 },
  },
  DensitySelector: {
    defaults: {},
    'controlled spacious sm': { value: 'spacious', size: 'sm' },
    'default compact': { defaultValue: 'compact' },
    'motion 0': { motion: 0 },
  },
  Rating: {
    empty: {},
    'three of five': { defaultValue: 3 },
    'controlled half, custom max': { value: 2.5, allowHalf: true, max: 4 },
    'half ignored without allowHalf': { value: 2.5 },
    'read-only, colour, size': { value: 4, readOnly: true, color: 'gold', size: 'xl' },
    'colour lost to caller style (inherited)': { value: 1, color: 'gold', style: { padding: 2 } },
    'custom icons and label': { value: 2, icon: { $el: '*' }, emptyIcon: 'o', 'aria-label': 'Quality' },
    'motion 0': { motion: 0 },
  },
  Chip: {
    defaults: { children: { $el: 'Tag' } },
    'controlled checked filled primary lg': { checked: true, variant: 'filled', color: 'primary', size: 'lg', name: 'tags', children: { $el: 'Tag' } },
    'default checked hides icon': { defaultChecked: true, icon: { $el: 'i' }, children: { $el: 'Tag' } },
    'icon shown when unchecked, disabled': { icon: 'i', disabled: true, children: { $el: 'Tag' } },
    'motion 0': { motion: 0, children: { $el: 'x' } },
  },
  Navbar: {
    'logo only': { logo: { $el: 'Acme' } },
    everything: { logo: 'Acme', actions: { $el: 'Sign in' }, height: 64, children: { $el: 'links' } },
    'not sticky, no border, transparent, caller style wins': { sticky: false, bordered: false, transparent: true, style: { '--navbar-height': '10px' } },
  },
  DiskMountBar: {
    'sorted, collapsed at 3': {
      mounts: [
        { mount: '/', totalBytes: 1e11, usedBytes: 5e10, freeBytes: 5e10, utilPct: 50 },
        { mount: '/var', totalBytes: 2 ** 40, usedBytes: 2 ** 39, freeBytes: 2 ** 39, utilPct: 93.25 },
        { mount: '/home', totalBytes: 512, usedBytes: 400, freeBytes: 112, utilPct: 78.1 },
        { mount: '/tmp', totalBytes: 4096, usedBytes: 4, freeBytes: 4092, utilPct: 0.1 },
      ],
    },
    'single mount shows free, lg': { showFree: true, size: 'lg', mounts: [{ mount: '/data', totalBytes: 3 * 1024 ** 2, usedBytes: 1024 ** 2, freeBytes: 2 * 1024 ** 2, utilPct: 33.3 }] },
    'no mounts': { mounts: [] },
    'motion 0': { mounts: [], motion: 0 },
  },
  SeverityTimeline: {
    basic: { events: [{ id: 'a', timestamp: Date.UTC(2026, 0, 15, 9, 30, 0), severity: 'critical', title: 'Outage' }, { id: 'b', timestamp: Date.UTC(2026, 0, 15, 9, 30, 0), severity: 'ok', title: { $el: 'Recovered' }, description: 'All good' }] },
    'expandable horizontal, cut to one': {
      orientation: 'horizontal', expandable: true, maxVisible: 1,
      events: [{ id: 'a', timestamp: Date.UTC(2026, 0, 15, 9, 30, 0), severity: 'warning', title: 'Slow', description: { $el: 'p95 up' } }, { id: 'b', timestamp: Date.UTC(2026, 0, 15, 9, 30, 0), severity: 'info', title: 'Deploy' }],
    },
    'expandable without description has no button': { expandable: true, events: [{ id: 'a', timestamp: Date.UTC(2026, 0, 15, 9, 30, 0), severity: 'info', title: 'x' }] },
    'motion 0': { events: [], motion: 0 },
  },
  PinInput: {
    defaults: {},
    'controlled partial, alphanumeric, unmasked': { value: 'a7', type: 'alphanumeric', mask: false, length: 6 },
    'error, disabled, one-time-code, lg': { value: '12', error: true, disabled: true, oneTimeCode: true, size: 'lg', placeholder: '-' },
    'custom aria-label': { 'aria-label': 'Verification code', length: 2 },
    'motion 0': { motion: 0, length: 1 },
  },
  TagInput: {
    empty: { tags: [], onChange: { $fn: true }, placeholder: 'Add tag', 'aria-label': 'Tags' },
    'with tags': { tags: ['alpha', 'beta'], onChange: { $fn: true }, 'aria-label': 'Tags', size: 'sm' },
    'disabled hides remove buttons': { tags: ['alpha'], onChange: { $fn: true }, disabled: true, 'aria-label': 'Tags' },
    'error wires aria-describedby': { tags: [], onChange: { $fn: true }, error: 'Too many', 'aria-label': 'Tags' },
    'motion 0': { tags: [], onChange: { $fn: true }, motion: 0, 'aria-label': 'Tags' },
  },
  DashboardGrid: {
    'ungrouped children': { children: { $el: 'cards' }, columns: 3, gap: 'lg' },
    groups: {
      groups: [
        { id: 'net', title: 'Network', description: 'Edge links', summary: { $el: '2 Gbps' }, items: [{ $el: 'card1' }, 'card2'] },
        { id: 'db', title: { $el: 'Databases' }, description: 'hidden while collapsed', items: [], collapsed: true },
      ],
    },
    'motion 0': { motion: 0 },
  },
  Slider: {
    defaults: {},
    'label, value, ticks, step': { label: 'Volume', showValue: true, showTicks: true, step: 25, defaultValue: 50 },
    'controlled, custom range, disabled xl': { value: 7, min: 5, max: 10, disabled: true, size: 'xl' },
    'min equals max': { min: 3, max: 3 },
    'ticks capped at 101': { showTicks: true, step: 0.5 },
    'motion 0': { motion: 0, 'aria-label': 'x' },
  },
  HeatmapCalendar: {
    empty: { data: [] },
    'month boundary, zeros, gaps': {
      data: [{ date: '2026-01-29', value: 0 }, { date: '2026-01-31', value: 4 }, { date: '2026-02-02', value: 8 }, { date: '2026-02-10', value: 2 }],
    },
    'explicit range and colours, clickable': {
      startDate: '2026-05-01', endDate: '2026-05-20', colorScale: ['#111', 'lime'], onDateClick: { $fn: true },
      data: [{ date: '2026-05-05', value: 1 }, { date: '2026-05-06', value: 5 }],
    },
    'motion 0': { data: [], motion: 0 },
  },
  SwitchFaceplate: {
    basic: { ports: [1, 2, 3, 4, 5].map(id => ({ id, status: id % 2 ? 'up' : 'down' })) },
    'labelled, clickable, three rows, labels shown': {
      label: 'core-sw1', rows: 3, showLabels: true, size: 'lg', onPortClick: { $fn: true },
      ports: [
        { id: 1, label: 'wan', status: 'up', speed: '10G', type: 'sfp' },
        { id: 2, status: 'admin-down', type: 'management' },
        { id: 3, label: 'lan', status: 'unused', vlan: 20 },
        { id: 4, status: 'up', type: 'qsfp' },
      ],
    },
    'motion 0': { ports: [], motion: 0 },
  },
  DataTableSuggestions: {
    basic: {
      onApply: { $fn: true },
      insights: [
        { id: 'a', type: 'aggregate', title: 'Sum revenue', description: 'Add a total row', confidence: 0.92, icon: 'calculator', apply: { showTotals: true } },
        { id: 'b', type: 'anomaly', title: 'Outliers', description: '3 rows stand out', confidence: 0.456, icon: 'unknown-icon' },
      ],
    },
    'no apply handler hides Apply': { insights: [{ id: 'a', type: 't', title: 'x', description: 'y', confidence: 1, icon: 'filter', apply: {} }] },
    'nothing to show': { insights: [] },
  },
  NetworkInterfaceGrid: {
    basic: { interfaces: [{ name: 'eth0', status: 'up', speed: '1G', duplex: 'full', type: 'ethernet' }, { name: 'lo', status: 'unknown', type: 'loopback' }] },
    'traffic, errors, columns, clickable, lg': {
      showTraffic: true, showErrors: true, columns: 3, size: 'lg', onInterfaceClick: { $fn: true },
      interfaces: [
        { name: 'bond0', status: 'up', type: 'bond', txRate: 2_000_000_000, rxRate: 512, txErrors: 0, rxErrors: 4 },
        { name: 'wlan0', status: 'dormant', type: 'wireless', txRate: 3 * 1_048_576, rxErrors: 0 },
        { name: 'br0', status: 'down', type: 'bridge', rxRate: 4096 },
      ],
    },
    'compact hides details, caller style': { compact: true, style: { gap: 4 }, interfaces: [{ name: 'eth1', status: 'up', speed: '10G', duplex: 'half' }] },
    'motion 0': { interfaces: [{ name: 'x', status: 'up' }], motion: 0 },
  },
  DiffViewer: {
    'unified with a fold': { oldValue: 'a\nb\nc\nd\ne\nf\ng', newValue: 'a\nb\nc\nd\ne\nf\nG', oldTitle: 'before', newTitle: 'after' },
    'side by side, no numbers': { mode: 'side-by-side', showLineNumbers: false, oldValue: 'x\ny\nz', newValue: 'x\nY\nz\nw' },
    'no folding, one title': { foldUnchanged: false, oldTitle: 'only old', oldValue: '1\n2\n3\n4\n5', newValue: '1\n2\n3\n4\n5\n6' },
    'identical input': { oldValue: 'same', newValue: 'same', foldThreshold: 0 },
    'motion 0': { oldValue: '', newValue: '', motion: 0 },
  },
  JsonViewer: {
    nested: { data: { name: 'api', port: 8080, tls: true, tags: ['a', 'b'], owner: null, limits: { cpu: 2, mem: { gb: 4 } } } },
    'collapsed, sorted, types, no sizes, root name': { data: { b: 1, a: 'x' }, collapsed: true, sortKeys: true, displayDataTypes: true, displayObjectSize: false, rootName: 'cfg' },
    'depth 1, indent 4, light, clipboard': { data: { a: { b: { c: 1 } } }, initialExpandDepth: 1, indentWidth: 4, theme: 'light', enableClipboard: true },
    'truncated string': { data: { s: 'a long string value' }, maxStringLength: 6 },
    'maxStringLength 0 renders a stray 0 (inherited)': { data: { s: 'abc' }, maxStringLength: 0 },
    'primitive root': { data: 'just text' },
    'empty array': { data: [] },
    'motion 0': { data: 1, motion: 0 },
  },
  CopyBlock: {
    'plain text': { code: 'hello\n  world' },
    typescript: { language: 'typescript', title: 'app.ts', highlight: [2], code: "import { x } from 'y'\nconst n = 42 // answer\n/* block */ export default n" },
    json: { language: 'json', code: '{\n  "a": 1,\n  "b": [true, null, -2.5e3],\n  "c": "s"\n}' },
    css: { language: 'css', showLineNumbers: false, code: '.x { color: red; width: 10px; } /* c */' },
    bash: { language: 'bash', code: '# install\nnpm install --save-dev "pkg" -D' },
    'sql, python, yaml': { language: 'sql', maxHeight: '12rem', code: "SELECT id, COUNT(*) FROM t WHERE a = 'b' -- note" },
    python: { language: 'python', code: 'def f(x):\n    return x + 1  # inc' },
    'motion 0': { code: 'x', motion: 0 },
  },
  PipelineDAG: {
    empty: { nodes: [], edges: [], height: '20rem' },
    'left to right': {
      nodes: [
        { id: 'src', label: 'Kafka', type: 'source', status: 'running' },
        { id: 'tx', label: 'Parse', type: 'transform', status: 'success' },
        { id: 'sink', label: 'Warehouse', type: 'sink', status: 'failed' },
      ],
      edges: [{ source: 'src', target: 'tx', label: 'events' }, { source: 'tx', target: 'sink', animated: false }],
    },
    'top to bottom, metrics, throughput, selected, clickable': {
      direction: 'TB', showMetrics: true, showThroughput: true, selectedNode: 'b', height: 420,
      onNodeClick: { $fn: true }, onEdgeClick: { $fn: true },
      nodes: [
        { id: 'a', label: 'In', type: 'custom', metrics: { throughput: 1500000, latency: 12, errorRate: 0.5, dropped: 3 } },
        { id: 'b', label: 'Filter', type: 'filter', status: 'skipped', metrics: { throughput: 900 } },
        { id: 'c', label: 'Agg', type: 'aggregate' },
      ],
      edges: [{ source: 'a', target: 'b', throughput: 2500 }, { source: 'b', target: 'c', throughput: 10 }],
    },
    'motion 0': { nodes: [], edges: [], motion: 0 },
  },
  VlanBusBar: {
    basic: { totalPorts: 6, vlans: [{ id: 10, name: 'mgmt', ports: [1, 2, 3] }, { id: 20, ports: [3, 4, 6], tagged: true, color: 'tomato' }] },
    'numbers, trunks, sequential, lg, clickable': {
      totalPorts: 4, showPortNumbers: true, showTrunkIndicator: true, colorScheme: 'sequential', size: 'lg', onVlanClick: { $fn: true }, onPortClick: { $fn: true },
      vlans: [{ id: 1, ports: [1, 2] }, { id: 2, ports: [2], tagged: true }, { id: 3, ports: [4] }],
    },
    'external highlight dims the rest': { totalPorts: 3, highlightVlans: [5], vlans: [{ id: 5, ports: [1] }, { id: 6, ports: [2, 3] }] },
    'highlighted port': { totalPorts: 3, highlightPorts: [3], vlans: [{ id: 5, ports: [1, 3] }, { id: 6, ports: [2] }] },
    'vertical compact, max height, caller style': { orientation: 'vertical', compactMode: true, showPortNumbers: true, maxHeight: 200, style: { border: '1px solid' }, totalPorts: 2, vlans: [{ id: 1, ports: [1, 2] }] },
    'motion 0': { totalPorts: 1, vlans: [], motion: 0 },
  },
}
