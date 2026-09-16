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
 *
 * Choose cases that change the MARKUP: every variant/size value that is an
 * attribute, every boolean that adds or removes an element, and the edge values
 * (0, empty, over-max). A case that renders the same tree as another adds
 * nothing. */

export type CaseProps = Record<string, unknown>

/* Exports that component-meta does not list (it lists one component per file),
 * mapped to the React source that exports them, so their cases can be rendered. */
export const SOURCES: Record<string, string> = {
  Icon: 'src/core/icons/icon.tsx',
  FilterPillGroup: 'src/components/filter-pill.tsx',
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
}
