# Security Policy

## Reporting a vulnerability

Email **contact@frontier-labs.in** with `[ui-kit security]` in the subject.
Please do not open a public issue for a vulnerability.

We aim to acknowledge within three working days. If you do not hear back,
please chase us — a report that goes unanswered is our failure, not yours.

Please include what you can: the version, a minimal reproduction, and what an
attacker would gain. A proof of concept is welcome but never required; we would
rather have a vague report than none.

## Supported versions

Only the latest minor of the current major receives security fixes.

| Version | Supported |
|---------|-----------|
| 3.x     | yes       |
| 2.x     | no — published as `@annondeveloper/ui-kit`, superseded by 3.0.0 |

## Scope

This is a client-side component library with no network calls, no telemetry and
no runtime dependencies beyond React. The surface worth attention is:

- **XSS through component props** — anywhere a prop reaches `dangerouslySetInnerHTML`
  or a URL attribute.
- **The MCP server** (`ui-kit-mcp`), which reads a generated registry and serves it
  over stdio or SSE. It executes nothing from the client and holds no credentials.
- **Prototype pollution** in the form engine or theme merge paths.

Denial of service caused by a caller passing deliberately pathological input to a
rendering function is out of scope.
