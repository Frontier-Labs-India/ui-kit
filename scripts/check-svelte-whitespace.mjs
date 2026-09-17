#!/usr/bin/env node
/* Visible whitespace, checked in a real browser. Manual: needs Chromium, so it
 * is not a CI step.
 *
 * Svelte keeps one space between sibling nodes on separate lines, where JSX
 * drops a line break and its indentation. Whether that space shows depends on
 * layout: nothing inside a flex container, a visible gap between inline
 * siblings. jsdom has no layout, so the DOM contract collapses whitespace and
 * cannot see the difference. This lays out every contract case twice in
 * Chromium, React's server HTML and Svelte's rendered HTML under the same
 * stylesheet, and compares `innerText`, which follows the rendered layout.
 * It reports cases whose texts differ only in whitespace. The first run found
 * four (SidebarItem icon+label, TimeRangeSelector label+input, PropertyList
 * and PluginDashboard value+copy button), each a 3-9px shift.
 *
 *   npm run build:svelte && npm run check:svelte-whitespace
 *   CHROME_BIN=/path/to/chrome   when Playwright's own browser is not installed */
import { chromium } from 'playwright'
import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync, existsSync, mkdtempSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { tmpdir, homedir } from 'node:os'

const ROOT = resolve(import.meta.dirname, '..')
const PKG = resolve(ROOT, 'packages/svelte')
const dumpFile = join(mkdtempSync(join(tmpdir(), 'ws-')), 'dump.json')

execFileSync('npx', ['vitest', 'run', 'tests/whitespace/dump-html.test.ts'], {
  cwd: PKG, stdio: ['ignore', 'ignore', 'inherit'], env: { ...process.env, WHITESPACE_DUMP: dumpFile },
})
const dump = JSON.parse(readFileSync(dumpFile, 'utf8'))
const css = ['theme.css', 'ui-kit-svelte.css', 'svelte-only.css']
  .map(f => readFileSync(resolve(PKG, 'dist/styles', f), 'utf8')).join('\n')

function chromeBin() {
  if (process.env.CHROME_BIN) return process.env.CHROME_BIN
  // A Playwright browser cache of another version still runs this page.
  const cache = join(homedir(), '.cache/ms-playwright')
  for (const d of existsSync(cache) ? readdirSync(cache).filter(d => /^chromium-\d+$/.test(d)).sort().reverse() : []) {
    for (const sub of ['chrome-linux64', 'chrome-linux']) {
      const p = join(cache, d, sub, 'chrome')
      if (existsSync(p)) return p
    }
  }
  return undefined // Playwright's default
}

const browser = await chromium.launch({ executablePath: chromeBin(), args: ['--no-sandbox'] })
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } })
await page.setContent(`<!doctype html><html><head><style>${css}</style></head><body><div id="a"></div><div id="b"></div></body></html>`)
const found = await page.evaluate(dump => {
  const a = document.getElementById('a'), b = document.getElementById('b')
  const squash = s => s.replace(/\s+/g, '')
  const out = []
  for (const [key, { react, svelte }] of Object.entries(dump)) {
    a.innerHTML = react
    b.innerHTML = svelte
    if (a.innerText !== b.innerText && squash(a.innerText) === squash(b.innerText)) {
      out.push({ key, react: a.innerText, svelte: b.innerText })
    }
  }
  return out
}, dump)
await browser.close()

const total = Object.keys(dump).length
if (total < 700) { console.error(`FAIL: only ${total} cases dumped — refusing to trust this run`); process.exit(1) }
for (const f of found) console.error(`FAIL: ${f.key}\n  React:  ${JSON.stringify(f.react)}\n  Svelte: ${JSON.stringify(f.svelte)}`)
console.log(`${total} cases laid out in Chromium; ${found.length} differ in visible whitespace.`)
process.exit(found.length ? 1 : 0)
