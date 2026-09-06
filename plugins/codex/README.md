# @frontier-labs/ui-kit — OpenAI Codex CLI Integration

Connect the OpenAI Codex CLI to the ui-kit MCP server.

## Setup

Add to your Codex MCP configuration (`~/.codex/config.json` or project-level):

```json
{
  "mcpServers": {
    "ui-kit": {
      "type": "sse",
      "url": "https://ui.frontier-labs.in/sse"
    }
  }
}
```

## Local Server (alternative)

```json
{
  "mcpServers": {
    "ui-kit": {
      "command": "npx",
      "args": ["@frontier-labs/ui-kit", "mcp"]
    }
  }
}
```
