import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: { 'mcp/index': 'src/mcp/index.ts' },
    outDir: 'dist',
    format: ['esm'],
    target: 'node20',
    clean: false,
    splitting: false,
    sourcemap: false,
    // The MCP SDK must NOT be bundled. Its SSE transport pulls in CJS-only
    // packages (depd, http-errors, raw-body); inlining them into an ESM bundle
    // makes their require() calls hit esbuild's shim, which throws
    // 'Dynamic require of "path" is not supported' at runtime. Typecheck and
    // build both pass while `--sse` is dead. Both are optionalDependencies, so
    // they resolve from node_modules where the bin actually runs.
    external: ['react', 'react-dom', '@modelcontextprotocol/sdk', 'zod'],
  },
  {
    entry: { 'mcp/scripts/build-registry': 'src/mcp/scripts/build-registry.ts' },
    outDir: 'dist',
    format: ['esm'],
    target: 'node20',
    clean: false,
    splitting: false,
    sourcemap: false,
    external: ['react', 'react-dom'],
  },
])
