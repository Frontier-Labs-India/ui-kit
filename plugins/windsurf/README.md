# @frontier-labs/ui-kit — Windsurf Integration

Connect Windsurf (Codeium) to the ui-kit MCP server.

## Setup

Add to your Windsurf MCP configuration:

```json
{
  "mcpServers": {
    "ui-kit": {
      "serverUrl": "https://ui.frontier-labs.in/sse"
    }
  }
}
```

Restart Windsurf. The MCP server provides access to all 162 components with full API docs and code generation.
