> **UNSUPPORTED — `/sse` does not work on Cloudflare Workers.**
>
> `SSEServerTransport` from the MCP SDK is a Node transport: `start()` calls
> `this.res.writeHead()` and `this.res.on('close')`. Workers has no
> `ServerResponse`, so `worker.ts` passes `new Response() as any` and
> `server.connect()` throws — Cloudflare returns error 1101 on every request.
> Patching `transport.send` (as this worker does) does not help, because
> `start()` runs first.
>
> Making this work needs a Workers-native MCP transport, which does not exist
> here. **The supported hosted deployment is Node, self-hosted:**
> `npx @frontier-labs/ui-kit mcp --sse --port 3100` behind a reverse proxy.
> That path runs `src/mcp/transports/sse.ts`, which passes a real
> `ServerResponse` and is covered by `src/__tests__/core/mcp-sse-boot.test.ts`.
>
> This directory is kept for reference. Do not deploy it expecting it to serve.

# ui-kit MCP Server — Cloudflare Worker

Hosted MCP server for `@frontier-labs/ui-kit`. Provides the same 6 tools as the local MCP server but accessible via HTTP SSE transport from anywhere.

## Setup

```bash
# From the project root, build the library and registry first
npm run build:mcp

# Then set up the worker
cd workers/mcp
npm install
npm run build:worker   # copies registry.json into src/

# Deploy to Cloudflare
npx wrangler login      # one-time auth
npx wrangler deploy     # deploy to workers.dev
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Landing page with setup instructions |
| `GET` | `/sse` | Establish SSE connection (MCP protocol) |
| `POST` | `/messages?sessionId=ID` | Send MCP messages |
| `GET` | `/health` | Health check |

## Connect Your AI

After deploying, add this to your MCP client config:

```json
{
  "mcpServers": {
    "ui-kit": {
      "url": "https://ui-kit-mcp.<your-subdomain>.workers.dev/sse"
    }
  }
}
```

## Local Development

```bash
npm run dev   # starts wrangler dev server on localhost:8787
```

## Architecture

- **Stateless** — reads a bundled JSON registry, no database
- **Edge-deployed** — runs on 300+ Cloudflare PoPs globally
- **Zero cold start** — V8 isolates boot in <1ms
- **Free tier** — 100K requests/day on Cloudflare free plan
