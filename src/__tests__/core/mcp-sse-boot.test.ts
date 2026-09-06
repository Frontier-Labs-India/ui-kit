import { describe, it, expect, afterAll } from 'vitest'
import { spawn, type ChildProcess } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

// The hosted MCP endpoint is the library's headline feature. It was broken two
// ways at once: the Cloudflare worker handed a Web `Response` to a transport
// that calls res.writeHead(), and this bundle inlined the SDK's CJS
// dependencies into ESM so `--sse` died on "Dynamic require of \"path\"".
// Both were invisible to typecheck, to the unit suite and to `npm run build`.
const ROOT = resolve(import.meta.dirname, '../../..')
const BIN = resolve(ROOT, 'dist/mcp/index.js')
const PORT = 3187

let child: ChildProcess | undefined
afterAll(() => { child?.kill('SIGKILL') })

describe('MCP SSE server boots from the built bundle', () => {
  it('serves /sse as an event stream', async () => {
    // Denominator check: a test against a missing bundle proves nothing.
    expect(existsSync(BIN), 'run `npm run build` first').toBe(true)

    child = spawn(process.execPath, [BIN, '--sse', '--port', String(PORT)], { stdio: 'pipe' })
    let stderr = ''
    child.stderr!.on('data', (d) => { stderr += String(d) })

    // Wait for the listening line, or surface whatever it died of instead.
    const listening = await new Promise<boolean>((res) => {
      const t = setTimeout(() => res(false), 15000)
      child!.stderr!.on('data', () => {
        if (stderr.includes('SSE server listening')) { clearTimeout(t); res(true) }
      })
      child!.on('exit', () => { clearTimeout(t); res(false) })
    })
    expect(listening, `server did not start. stderr:\n${stderr}`).toBe(true)

    const ac = new AbortController()
    const r = await fetch(`http://127.0.0.1:${PORT}/sse`, { signal: ac.signal })
    expect(r.status).toBe(200)
    expect(r.headers.get('content-type')).toContain('text/event-stream')
    ac.abort()
  }, 30000)
})
